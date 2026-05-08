import { copyFile, mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileSha256, isNodeError } from "../utils/checksum.js";
import { pathExists, writeTextAtomic } from "../utils/fs.js";
import { decodePathSegment, encodePathSegment, normalizeRelativePath } from "../utils/path.js";
import type { SnapshotFileEntry, SnapshotManifest } from "../types/safety.js";

const SNAPSHOT_DIR = ".vision/snapshots";

export class SnapshotManager {
  private readonly rootDir: string;
  private readonly retention: number;

  public constructor(rootDir: string, retention: number) {
    this.rootDir = path.resolve(rootDir);
    this.retention = retention;
  }

  public async createSnapshot(reason: string, filePaths: readonly string[]): Promise<SnapshotManifest> {
    const id = createSnapshotId();
    const snapshotRoot = this.snapshotRoot(id);
    const filesRoot = path.join(snapshotRoot, "files");
    await mkdir(filesRoot, { recursive: true });

    const files: SnapshotFileEntry[] = [];
    for (const filePath of filePaths) {
      const absolutePath = path.resolve(filePath);
      const relativePath = normalizeRelativePath(path.relative(this.rootDir, absolutePath));
      const existed = await pathExists(absolutePath);
      const encoded = encodePathSegment(relativePath);
      const snapshotPath = normalizeRelativePath(path.join("files", encoded));
      const checksumBefore = existed ? await fileSha256(absolutePath) : undefined;

      if (existed) {
        await copyFile(absolutePath, path.join(snapshotRoot, snapshotPath));
      }

      files.push({
        relativePath,
        snapshotPath,
        existed,
        checksumBefore
      });
    }

    const manifest: SnapshotManifest = {
      id,
      createdAt: new Date().toISOString(),
      rootDir: this.rootDir,
      reason,
      files
    };
    await writeFile(path.join(snapshotRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    await this.pruneSnapshots();
    return manifest;
  }

  public async listSnapshots(): Promise<readonly SnapshotManifest[]> {
    const root = path.resolve(this.rootDir, SNAPSHOT_DIR);
    if (!(await pathExists(root))) {
      return [];
    }

    const entries = await readdir(root, { withFileTypes: true });
    const manifests: SnapshotManifest[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const manifest = await this.readManifest(entry.name);
      if (manifest !== undefined) {
        manifests.push(manifest);
      }
    }

    return manifests.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  public async restoreSnapshot(id: string): Promise<readonly string[]> {
    const manifest = await this.readManifest(id);
    if (manifest === undefined) {
      throw new Error(`Snapshot ${id} does not exist.`);
    }

    const restored: string[] = [];
    for (const entry of manifest.files) {
      const targetPath = path.resolve(this.rootDir, entry.relativePath);
      if (entry.existed) {
        const sourcePath = path.resolve(this.snapshotRoot(id), entry.snapshotPath);
        const content = await readFile(sourcePath, "utf8");
        await writeTextAtomic(targetPath, content);
      } else if (await pathExists(targetPath)) {
        await unlink(targetPath);
      }
      restored.push(targetPath);
    }

    return restored;
  }

  private async readManifest(id: string): Promise<SnapshotManifest | undefined> {
    const manifestPath = path.join(this.snapshotRoot(id), "manifest.json");
    try {
      const content = await readFile(manifestPath, "utf8");
      return JSON.parse(content) as SnapshotManifest;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return undefined;
      }

      throw error;
    }
  }

  private snapshotRoot(id: string): string {
    return path.resolve(this.rootDir, SNAPSHOT_DIR, id);
  }

  private async pruneSnapshots(): Promise<void> {
    if (this.retention <= 0) {
      return;
    }

    const snapshots = await this.listSnapshots();
    const stale = snapshots.slice(this.retention);
    for (const snapshot of stale) {
      await rm(this.snapshotRoot(snapshot.id), { recursive: true, force: true });
    }
  }
}

function createSnapshotId(): string {
  const iso = new Date().toISOString().split(".")[0]?.split(":").join("").split("-").join("") ?? String(Date.now());
  return `vs_${iso}_${process.pid}`;
}

export function decodeSnapshotFilePath(encoded: string): string {
  return decodePathSegment(encoded);
}
