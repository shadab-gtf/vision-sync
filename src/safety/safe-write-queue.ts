import path from "node:path";
import { fileSha256 } from "../utils/checksum.js";
import { readTextIfExists, writeTextAtomic } from "../utils/fs.js";
import { createFileDiff } from "./diff.js";
import { checkWriteOwnership } from "./ownership.js";
import type { VisionConfig } from "../types/config.js";
import type { CommitResult, FileDiff, WriteConflict, WriteIntent, WritePlan } from "../types/safety.js";
import type { SnapshotManager } from "./snapshot-manager.js";

export class SafeWriteQueue {
  private readonly rootDir: string;
  private readonly config: VisionConfig;
  private readonly snapshotManager: SnapshotManager;

  public constructor(rootDir: string, config: VisionConfig, snapshotManager: SnapshotManager) {
    this.rootDir = path.resolve(rootDir);
    this.config = config;
    this.snapshotManager = snapshotManager;
  }

  public async analyze(intents: readonly WriteIntent[]): Promise<WritePlan> {
    const diffs: FileDiff[] = [];
    const conflicts: WriteConflict[] = [];

    for (const intent of intents) {
      const filePath = path.resolve(intent.filePath);
      const before = await readTextIfExists(filePath);
      if (before !== undefined && !intent.allowOverwrite) {
        conflicts.push({
          filePath,
          reason: "The target file already exists and overwrite was not approved.",
          suggestion: "Run with an explicit confirmation or choose a different output path."
        });
      }

      const ownership = checkWriteOwnership(this.rootDir, this.config, filePath, before, intent.ownership);
      if (!ownership.allowed) {
        conflicts.push({
          filePath,
          reason: ownership.reason ?? "Ownership check failed.",
          suggestion: ownership.suggestion ?? "Review the file boundary and rerun in preview mode."
        });
      }

      if (this.config.safety.readonlyMode) {
        conflicts.push({
          filePath,
          reason: "Readonly mode is enabled.",
          suggestion: "Disable readonlyMode or run with preview only."
        });
      }

      diffs.push(createFileDiff(filePath, before, intent.content));
    }

    return { intents, diffs, conflicts };
  }

  public async commit(intents: readonly WriteIntent[], reason: string, dryRun: boolean): Promise<CommitResult> {
    const plan = await this.analyze(intents);
    if (plan.conflicts.length > 0) {
      return {
        snapshotId: undefined,
        writtenFiles: [],
        diffs: plan.diffs
      };
    }

    const changedDiffs = plan.diffs.filter((diff) => diff.status !== "unchanged");
    if (dryRun || changedDiffs.length === 0) {
      return {
        snapshotId: undefined,
        writtenFiles: [],
        diffs: plan.diffs
      };
    }

    const changedIntents = intents.filter((intent) => {
      const matchingDiff = changedDiffs.find((diff) => path.resolve(diff.filePath) === path.resolve(intent.filePath));
      return matchingDiff !== undefined;
    });
    const snapshot = this.config.safety.rollback
      ? await this.snapshotManager.createSnapshot(reason, changedIntents.map((intent) => intent.filePath))
      : undefined;
    const writtenFiles: string[] = [];

    try {
      for (const intent of changedIntents) {
        await writeTextAtomic(intent.filePath, intent.content);
        if (this.config.safety.checksumValidation) {
          const checksum = await fileSha256(intent.filePath);
          const expected = await checksumForContent(intent.content);
          if (checksum !== expected) {
            throw new Error(`Checksum validation failed for ${intent.filePath}.`);
          }
        }
        writtenFiles.push(path.resolve(intent.filePath));
      }
    } catch (error) {
      if (snapshot !== undefined) {
        await this.snapshotManager.restoreSnapshot(snapshot.id);
      }
      throw error;
    }

    return {
      snapshotId: snapshot?.id,
      writtenFiles,
      diffs: plan.diffs
    };
  }
}

async function checksumForContent(content: string): Promise<string> {
  const { sha256 } = await import("../utils/checksum.js");
  return sha256(content);
}
