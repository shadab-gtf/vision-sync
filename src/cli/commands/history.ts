import { SnapshotManager } from "../../safety/snapshot-manager.js";
import { DEFAULT_CONFIG } from "../../config/defaults.js";
import { renderMuted } from "../ui.js";

export async function runHistoryCommand(rootDir: string): Promise<void> {
  const snapshots = await new SnapshotManager(rootDir, DEFAULT_CONFIG.safety.rollbackRetention).listSnapshots();
  if (snapshots.length === 0) {
    renderMuted("No rollback snapshots found.");
    return;
  }

  for (const snapshot of snapshots) {
    console.log(`${snapshot.id}  ${snapshot.createdAt}  ${snapshot.reason}`);
  }
}
