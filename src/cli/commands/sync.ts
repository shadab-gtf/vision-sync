import prompts from "prompts";
import { runSync } from "../../engine/sync-engine.js";
import { renderConflicts, renderDiffs, renderMuted, renderSchemaDigest, renderSuccess, withSpinner } from "../ui.js";
import type { CliFlags } from "../args.js";

export async function runSyncCommand(rootDir: string, flags: CliFlags): Promise<void> {
  const shouldWriteImmediately = flags.yes && !flags.preview;
  const previewResult = await withSpinner("Generating integration preview", () => runSync(rootDir, {
    configPath: flags.configPath,
    schemaOverride: flags.schema,
    dryRun: shouldWriteImmediately ? false : true,
    previewOnly: flags.preview,
    aliasMode: flags.aliasMode
  }));

  renderSchemaDigest(previewResult.schema);
  renderConflicts(previewResult.conflicts);
  renderDiffs(previewResult.diffs);

  if (previewResult.conflicts.length > 0) {
    renderMuted("No files were modified.");
    return;
  }

  if (shouldWriteImmediately) {
    renderSuccess(previewResult.snapshotId === undefined
      ? "Sync completed. No file changes were required."
      : `Sync completed. Snapshot: ${previewResult.snapshotId}`);
    return;
  }

  if (flags.preview) {
    renderMuted("Preview mode enabled. No files were modified.");
    return;
  }

  const response = await prompts({
    type: "confirm",
    name: "continue",
    message: "Apply these changes with a rollback snapshot?",
    initial: true
  }, {
    onCancel: () => ({ continue: false })
  }) as { readonly continue?: boolean };

  if (response.continue !== true) {
    renderMuted("No files were modified.");
    return;
  }

  const writeResult = await withSpinner("Applying safe write transaction", () => runSync(rootDir, {
    configPath: flags.configPath,
    schemaOverride: flags.schema,
    dryRun: false,
    aliasMode: flags.aliasMode
  }));
  renderConflicts(writeResult.conflicts);
  renderDiffs(writeResult.diffs);
  renderSuccess(writeResult.snapshotId === undefined
    ? "Sync completed. No file changes were required."
    : `Sync completed. Snapshot: ${writeResult.snapshotId}`);
}
