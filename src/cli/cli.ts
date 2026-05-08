import { parseCliArgs } from "./args.js";
import { runHistoryCommand } from "./commands/history.js";
import { runInitCommand } from "./commands/init.js";
import { runRollbackCommand } from "./commands/rollback.js";
import { runSyncCommand } from "./commands/sync.js";
import { runWatchCommand } from "./commands/watch.js";
import { printHelp } from "./help.js";
import { renderError } from "./ui.js";

export async function runCli(argv: readonly string[] = process.argv.slice(2), rootDir: string = process.cwd()): Promise<number> {
  const parsed = parseCliArgs(argv);

  try {
    switch (parsed.command) {
      case "init":
        await runInitCommand(rootDir, parsed.flags);
        return 0;
      case "sync":
        await runSyncCommand(rootDir, parsed.flags);
        return 0;
      case "watch":
        await runWatchCommand(rootDir, parsed.flags);
        return 0;
      case "history":
        await runHistoryCommand(rootDir);
        return 0;
      case "rollback":
      case "restore":
        await runRollbackCommand(rootDir, parsed.positional[0]);
        return 0;
      case "help":
      case "--help":
      case "-h":
        printHelp();
        return 0;
      default:
        printHelp();
        return 1;
    }
  } catch (error) {
    renderError(error);
    return 1;
  }
}
