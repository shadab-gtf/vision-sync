import boxen from "boxen";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { VisionError } from "../errors/vision-error.js";
import type { DetectionResult } from "../types/project.js";
import type { FileDiff, WriteConflict } from "../types/safety.js";
import type { SchemaDigest } from "../types/openapi.js";

export function printHeader(title: string, subtitle?: string): void {
  const text = subtitle === undefined ? chalk.bold(title) : `${chalk.bold(title)}\n${subtitle}`;
  console.log(boxen(text, {
    padding: 1,
    borderColor: "cyan",
    margin: { top: 1, bottom: 1 }
  }));
}

export async function withSpinner<T>(text: string, task: () => Promise<T>): Promise<T> {
  if (!process.stdout.isTTY) {
    return await task();
  }

  const spinner = ora(text).start();
  try {
    const result = await task();
    spinner.succeed(text);
    return result;
  } catch (error) {
    spinner.fail(text);
    throw error;
  }
}

export function renderDetection(detection: DetectionResult): void {
  const rows = [
    ["Project", detection.projectKind],
    ["Router", detection.routerKind],
    ["Package manager", detection.packageManager],
    ["TypeScript", yesNo(detection.capabilities.typescript)],
    ["TanStack Query", yesNo(detection.capabilities.tanstackQuery)],
    ["Tailwind", yesNo(detection.capabilities.tailwind)],
    ["API layer", yesNo(detection.capabilities.existingApiLayer)],
    ["Components", yesNo(detection.capabilities.componentDriven)]
  ];
  const table = new Table({
    head: [chalk.cyan("Detected"), chalk.cyan("Value")]
  });
  table.push(...rows);
  console.log(table.toString());
}

export function renderSchemaDigest(schema: SchemaDigest | undefined): void {
  if (schema === undefined) {
    return;
  }

  console.log(chalk.bold("Schema"));
  console.log(`  Title: ${schema.title ?? "Unknown"}`);
  console.log(`  Version: ${schema.version ?? "Unknown"}`);
  console.log(`  Endpoints: ${schema.endpointCount}`);
  console.log(`  Entities: ${schema.entityCount}`);
}

export function renderDiffs(diffs: readonly FileDiff[]): void {
  const changed = diffs.filter((diff) => diff.status !== "unchanged");
  if (changed.length === 0) {
    console.log(chalk.green("No file changes detected."));
    return;
  }

  const table = new Table({
    head: [chalk.cyan("File"), chalk.cyan("Status"), chalk.cyan("+"), chalk.cyan("-")]
  });
  for (const diff of changed) {
    table.push([diff.filePath, diff.status, String(diff.additions), String(diff.deletions)]);
  }
  console.log(table.toString());

  for (const diff of changed.slice(0, 5)) {
    console.log(chalk.bold(`\n${diff.filePath}`));
    console.log(colorDiffPreview(diff.preview));
  }
}

export function renderConflicts(conflicts: readonly WriteConflict[]): void {
  if (conflicts.length === 0) {
    return;
  }

  for (const conflict of conflicts) {
    console.log(chalk.red("Unsafe change prevented"));
    console.log(`File: ${conflict.filePath}`);
    console.log(`Reason: ${conflict.reason}`);
    console.log(`Suggested Fix: ${conflict.suggestion}`);
  }
}

export function renderError(error: unknown): void {
  if (error instanceof VisionError) {
    console.error(chalk.red(`\n${error.message}`));
    console.error(`Reason: ${error.details.reason}`);
    console.error(`Suggested Fix: ${error.details.suggestion}`);
    if (error.details.filePath !== undefined) {
      console.error(`File: ${error.details.filePath}`);
    }
    return;
  }

  if (error instanceof Error) {
    console.error(chalk.red(error.message));
    return;
  }

  console.error(chalk.red("Unknown error."));
}

export function renderSuccess(message: string): void {
  console.log(chalk.green(message));
}

export function renderMuted(message: string): void {
  console.log(chalk.gray(message));
}

function colorDiffPreview(preview: string): string {
  return preview
    .split("\n")
    .map((line) => {
      if (line.startsWith("+")) {
        return chalk.green(line);
      }
      if (line.startsWith("-")) {
        return chalk.red(line);
      }
      return chalk.gray(line);
    })
    .join("\n");
}

function yesNo(value: boolean): string {
  return value ? chalk.green("yes") : chalk.gray("no");
}
