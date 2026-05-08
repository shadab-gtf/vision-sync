import { SnapshotManager } from "../../safety/snapshot-manager.js";
import { DEFAULT_CONFIG } from "../../config/defaults.js";
import { renderMuted, renderSuccess } from "../ui.js";

export async function runRollbackCommand(rootDir: string, snapshotId: string | undefined): Promise<void> {
  const manager = new SnapshotManager(rootDir, DEFAULT_CONFIG.safety.rollbackRetention);
  const snapshots = await manager.listSnapshots();
  const target = snapshotId ?? snapshots[0]?.id;
  if (target === undefined) {
    renderMuted("No rollback snapshots found.");
    return;
  }

  const restored = await manager.restoreSnapshot(target);
  renderSuccess(`Restored snapshot ${target}.`);
  for (const filePath of restored) {
    console.log(filePath);
  }
}
