import path from "node:path";
import { mkdir, readFile } from "node:fs/promises";
import { DEFAULT_CONFIG } from "../config/defaults.js";
import { loadConfig } from "../config/load-config.js";
import { createGenerationPlan } from "../generator/generation-plan.js";
import { loadOpenApiDocument } from "../schema/openapi-loader.js";
import { createSchemaDigest } from "../schema/schema-model.js";
import { diffSchemaDigests } from "../schema/schema-diff.js";
import { detectProject } from "../project/detect-project.js";
import { SafeWriteQueue } from "../safety/safe-write-queue.js";
import { SnapshotManager } from "../safety/snapshot-manager.js";
import { VisionError } from "../errors/vision-error.js";
import { writeTextAtomic } from "../utils/fs.js";
import { isNodeError } from "../utils/checksum.js";
import { validateGeneratedIntents } from "../validation/generated-validation.js";
import type { SchemaSource, VisionConfig } from "../types/config.js";
import type { SchemaDigest } from "../types/openapi.js";
import type { SyncOptions, SyncResult } from "../types/sync.js";

const DIGEST_CACHE_PATH = ".vision/cache/schema-digest.json";

export async function runSync(rootDir: string, options: SyncOptions = {}): Promise<SyncResult> {
  const absoluteRoot = path.resolve(rootDir);
  const loaded = await loadConfig(absoluteRoot, options.configPath);
  const detection = await detectProject(absoluteRoot);
  const config = withDetectedProject(loaded.config, detection);
  const schemaSource = options.schemaOverride === undefined
    ? config.schema
    : schemaSourceFromOverride(options.schemaOverride);
  const document = await loadOpenApiDocument(absoluteRoot, schemaSource);
  const digest = createSchemaDigest(document);
  const previousDigest = await readCachedDigest(absoluteRoot);
  const operationDiff = diffSchemaDigests(previousDigest, digest);
  const generationPlan = createGenerationPlan(config, detection, document, digest);
  validateGeneratedIntents(generationPlan.intents);
  const snapshotManager = new SnapshotManager(absoluteRoot, config.safety.rollbackRetention);
  const writeQueue = new SafeWriteQueue(absoluteRoot, config, snapshotManager);
  const requestedDryRun = options.previewOnly === true ? true : options.dryRun;
  const dryRun = requestedDryRun ?? (config.safety.dryRunByDefault || config.safety.previewMode);
  const commit = await writeQueue.commit(
    generationPlan.intents,
    `sync ${digest.checksum}`,
    dryRun
  );
  const analysis = await writeQueue.analyze(generationPlan.intents);

  if (!dryRun && analysis.conflicts.length === 0) {
    await writeDigestCache(absoluteRoot, digest);
  }

  return {
    dryRun,
    snapshotId: commit.snapshotId,
    changedFiles: commit.writtenFiles,
    diffs: commit.diffs,
    conflicts: analysis.conflicts,
    detection,
    schema: {
      ...digest,
      operations: [
        ...operationDiff.added,
        ...operationDiff.changed,
        ...operationDiff.unchanged
      ]
    }
  };
}

function withDetectedProject(config: VisionConfig, detection: Awaited<ReturnType<typeof detectProject>>): VisionConfig {
  return {
    ...config,
    project: {
      ...config.project,
      rootDir: detection.rootDir,
      packageManager: detection.packageManager === "unknown" ? config.project.packageManager : detection.packageManager,
      importAlias: detection.importAlias ?? config.project.importAlias,
      framework: detection.projectKind === "unknown" ? config.project.framework : detection.projectKind,
      router: detection.routerKind === "unknown" ? config.project.router : detection.routerKind
    }
  };
}

function schemaSourceFromOverride(value: string): SchemaSource {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return {
      type: "url",
      url: value
    };
  }

  return {
    type: "file",
    path: value
  };
}

async function readCachedDigest(rootDir: string): Promise<SchemaDigest | undefined> {
  try {
    const content = await readFile(path.resolve(rootDir, DIGEST_CACHE_PATH), "utf8");
    return JSON.parse(content) as SchemaDigest;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

async function writeDigestCache(rootDir: string, digest: SchemaDigest): Promise<void> {
  await mkdir(path.resolve(rootDir, ".vision", "cache"), { recursive: true });
  await writeTextAtomic(path.resolve(rootDir, DIGEST_CACHE_PATH), JSON.stringify(digest, null, 2));
}

export function assertWritableSyncResult(result: SyncResult): void {
  if (result.conflicts.length > 0) {
    const first = result.conflicts[0];
    const details = first?.filePath === undefined
      ? {
          reason: first?.reason ?? "A write conflict was detected.",
          suggestion: first?.suggestion ?? "Run preview mode and inspect the file ownership boundary."
        }
      : {
          reason: first.reason,
          suggestion: first.suggestion,
          filePath: first.filePath
        };
    throw new VisionError("UNSAFE_WRITE", "Unsafe write prevented.", {
      ...details
    });
  }
}

export function defaultSyncConfig(): VisionConfig {
  return DEFAULT_CONFIG;
}
