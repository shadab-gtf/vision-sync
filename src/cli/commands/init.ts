import path from "node:path";
import prompts from "prompts";
import { DEFAULT_CONFIG } from "../../config/defaults.js";
import { createConfigTemplate, type InitAnswers } from "../config-template.js";
import { detectProject } from "../../project/detect-project.js";
import { SafeWriteQueue } from "../../safety/safe-write-queue.js";
import { SnapshotManager } from "../../safety/snapshot-manager.js";
import { pathExists } from "../../utils/fs.js";
import { printHeader, renderDetection, renderDiffs, renderSuccess, withSpinner } from "../ui.js";
import type { CliFlags } from "../args.js";
import type { GenerationMode, IntegrationLevel } from "../../types/config.js";
import type { WriteIntent } from "../../types/safety.js";

export async function runInitCommand(rootDir: string, flags: CliFlags): Promise<void> {
  printHeader("Vision Sync Setup");
  const detection = await withSpinner("Scanning project", () => detectProject(rootDir));
  renderDetection(detection);

  const defaults: InitAnswers = {
    schema: flags.schema,
    output: flags.output ?? DEFAULT_CONFIG.output.baseDir,
    rollback: true,
    safeMode: true,
    level: flags.level ?? 1,
    mode: modeForLevel(flags.level ?? 1)
  };
  const answers = flags.yes ? defaults : await askInitQuestions(defaults);
  const configPath = path.resolve(rootDir, "vision.config.ts");
  const exists = await pathExists(configPath);
  const content = createConfigTemplate(detection, answers);
  const snapshotManager = new SnapshotManager(rootDir, DEFAULT_CONFIG.safety.rollbackRetention);
  const queue = new SafeWriteQueue(rootDir, DEFAULT_CONFIG, snapshotManager);
  const intent: WriteIntent = {
    filePath: configPath,
    content,
    reason: "Vision Sync config",
    ownership: "tooling",
    allowOverwrite: flags.yes || !exists
  };
  const result = await queue.commit([intent], "init config", false);

  renderDiffs(result.diffs);
  renderSuccess("Configuration created. Run vision-sync sync to preview generated integration files.");
}

async function askInitQuestions(defaults: InitAnswers): Promise<InitAnswers> {
  const response = await prompts([
    {
      type: "text",
      name: "schema",
      message: "Enter your OpenAPI URL or file path",
      initial: defaults.schema ?? ""
    },
    {
      type: "confirm",
      name: "safeMode",
      message: "Enable safe integration mode?",
      initial: defaults.safeMode
    },
    {
      type: "confirm",
      name: "rollback",
      message: "Enable automatic rollback snapshots?",
      initial: defaults.rollback
    },
    {
      type: "select",
      name: "level",
      message: "Select generation strategy",
      choices: [
        { title: "Conservative Safe Mode - hooks/types/client", value: 1 },
        { title: "Standard Mode - generated modules too", value: 2 },
        { title: "Advanced Mode - AST previews enabled", value: 3 },
        { title: "Preview Mode - inspect only", value: 4 }
      ],
      initial: 0
    },
    {
      type: "text",
      name: "output",
      message: "Select output directory",
      initial: defaults.output
    }
  ], {
    onCancel: () => {
      throw new Error("Setup cancelled.");
    }
  }) as Partial<InitAnswers>;

  const level = normalizeLevel(response.level, defaults.level);
  return {
    schema: normalizeString(response.schema, defaults.schema),
    output: normalizeString(response.output, defaults.output) ?? defaults.output,
    rollback: response.rollback ?? defaults.rollback,
    safeMode: response.safeMode ?? defaults.safeMode,
    level,
    mode: modeForLevel(level)
  };
}

function normalizeString(value: string | undefined, fallback: string | undefined): string | undefined {
  if (value === undefined) {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? fallback : trimmed;
}

function normalizeLevel(value: IntegrationLevel | undefined, fallback: IntegrationLevel): IntegrationLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : fallback;
}

function modeForLevel(level: IntegrationLevel): GenerationMode {
  if (level === 1) {
    return "conservative";
  }
  if (level === 2) {
    return "standard";
  }
  if (level === 3) {
    return "advanced";
  }
  return "preview";
}
