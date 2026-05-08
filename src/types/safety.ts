export interface FileDiff {
  readonly filePath: string;
  readonly status: "created" | "modified" | "unchanged" | "deleted";
  readonly additions: number;
  readonly deletions: number;
  readonly preview: string;
}

export interface WriteIntent {
  readonly filePath: string;
  readonly content: string;
  readonly reason: string;
  readonly ownership: "generated" | "tooling" | "developer-approved";
  readonly allowOverwrite: boolean;
}

export interface WriteConflict {
  readonly filePath: string;
  readonly reason: string;
  readonly suggestion: string;
}

export interface WritePlan {
  readonly intents: readonly WriteIntent[];
  readonly diffs: readonly FileDiff[];
  readonly conflicts: readonly WriteConflict[];
}

export interface SnapshotFileEntry {
  readonly relativePath: string;
  readonly snapshotPath: string;
  readonly existed: boolean;
  readonly checksumBefore: string | undefined;
}

export interface SnapshotManifest {
  readonly id: string;
  readonly createdAt: string;
  readonly rootDir: string;
  readonly reason: string;
  readonly files: readonly SnapshotFileEntry[];
}

export interface CommitResult {
  readonly snapshotId: string | undefined;
  readonly writtenFiles: readonly string[];
  readonly diffs: readonly FileDiff[];
}
