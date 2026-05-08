import { watch } from "node:fs";
import path from "node:path";
import { loadConfig } from "../../config/load-config.js";
import { runSync } from "../../engine/sync-engine.js";
import { renderConflicts, renderDiffs, renderMuted, renderSuccess, withSpinner } from "../ui.js";
import type { CliFlags } from "../args.js";

export async function runWatchCommand(rootDir: string, flags: CliFlags): Promise<void> {
  const loaded = await loadConfig(rootDir, flags.configPath);
  const schemaPath = flags.schema ?? (loaded.config.schema?.type === "file" ? loaded.config.schema.path : undefined);
  const interval = flags.interval ?? 5000;

  if (schemaPath === undefined) {
    renderMuted("Watch mode needs a local schema file. Pass --schema ./openapi.json for file watching.");
    return;
  }

  const absoluteSchemaPath = path.resolve(rootDir, schemaPath);
  renderSuccess(`Watching ${absoluteSchemaPath}`);
  let running = false;

  const run = async (): Promise<void> => {
    if (running) {
      return;
    }
    running = true;
    try {
      const result = await withSpinner("API change detected. Regenerating affected files", () => runSync(rootDir, {
        configPath: flags.configPath,
        schemaOverride: schemaPath,
        dryRun: !flags.yes
      }));
      renderConflicts(result.conflicts);
      renderDiffs(result.diffs);
    } finally {
      running = false;
    }
  };

  watch(absoluteSchemaPath, () => {
    setTimeout(() => {
      void run();
    }, Math.min(interval, 1000));
  });
}
