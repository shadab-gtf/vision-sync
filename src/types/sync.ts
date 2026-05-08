import type { DetectionResult } from "./project.js";
import type { FileDiff, WriteConflict } from "./safety.js";
import type { SchemaDigest } from "./openapi.js";

export interface SyncOptions {
  readonly configPath?: string | undefined;
  readonly schemaOverride?: string | undefined;
  readonly dryRun?: boolean | undefined;
  readonly yes?: boolean | undefined;
  readonly previewOnly?: boolean | undefined;
  readonly aliasMode?: boolean | undefined;
}

export interface SyncResult {
  readonly dryRun: boolean;
  readonly snapshotId: string | undefined;
  readonly changedFiles: readonly string[];
  readonly diffs: readonly FileDiff[];
  readonly conflicts: readonly WriteConflict[];
  readonly detection: DetectionResult;
  readonly schema: SchemaDigest | undefined;
}
