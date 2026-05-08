import type { IntegrationLevel } from "../types/config.js";

export interface CliFlags {
  readonly configPath: string | undefined;
  readonly schema: string | undefined;
  readonly output: string | undefined;
  readonly yes: boolean;
  readonly preview: boolean;
  readonly dryRun: boolean | undefined;
  readonly aliasMode: boolean;
  readonly level: IntegrationLevel | undefined;
  readonly interval: number | undefined;
}

export interface ParsedCliArgs {
  readonly command: string;
  readonly positional: readonly string[];
  readonly flags: CliFlags;
}

export function parseCliArgs(argv: readonly string[]): ParsedCliArgs {
  const command = argv[0] ?? "help";
  const positional: string[] = [];
  const flagValues = new Map<string, string | boolean>();
  let index = 1;

  while (index < argv.length) {
    const entry = argv[index];
    if (entry === undefined) {
      index += 1;
      continue;
    }

    if (!entry.startsWith("--")) {
      positional.push(entry);
      index += 1;
      continue;
    }

    const withoutPrefix = entry.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    if (equalsIndex >= 0) {
      flagValues.set(withoutPrefix.slice(0, equalsIndex), withoutPrefix.slice(equalsIndex + 1));
      index += 1;
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flagValues.set(withoutPrefix, next);
      index += 2;
      continue;
    }

    flagValues.set(withoutPrefix, true);
    index += 1;
  }

  return {
    command,
    positional,
    flags: {
      configPath: stringFlag(flagValues, "config"),
      schema: stringFlag(flagValues, "schema"),
      output: stringFlag(flagValues, "output"),
      yes: booleanFlag(flagValues, "yes") || booleanFlag(flagValues, "y"),
      preview: booleanFlag(flagValues, "preview"),
      dryRun: booleanFlag(flagValues, "dry-run") ? true : booleanFlag(flagValues, "write") ? false : undefined,
      aliasMode: booleanFlag(flagValues, "alias-mode"),
      level: levelFlag(flagValues),
      interval: numberFlag(flagValues, "interval")
    }
  };
}

function stringFlag(values: ReadonlyMap<string, string | boolean>, name: string): string | undefined {
  const value = values.get(name);
  return typeof value === "string" ? value : undefined;
}

function booleanFlag(values: ReadonlyMap<string, string | boolean>, name: string): boolean {
  return values.get(name) === true;
}

function numberFlag(values: ReadonlyMap<string, string | boolean>, name: string): number | undefined {
  const value = stringFlag(values, name);
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function levelFlag(values: ReadonlyMap<string, string | boolean>): IntegrationLevel | undefined {
  const raw = stringFlag(values, "level");
  if (raw === "1" || raw === "2" || raw === "3" || raw === "4") {
    return Number(raw) as IntegrationLevel;
  }

  return undefined;
}
