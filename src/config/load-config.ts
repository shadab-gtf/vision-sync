import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { DEFAULT_CONFIG } from "./defaults.js";
import { defineConfig } from "./define-config.js";
import { VisionError } from "../errors/vision-error.js";
import { isRecord } from "../types/json.js";
import { sha256 } from "../utils/checksum.js";
import { deepMerge } from "../utils/deep-merge.js";
import { pathExists, readJsonIfExists } from "../utils/fs.js";
import type { ConfigInput, VisionConfig } from "../types/config.js";

const CONFIG_CANDIDATES = [
  "vision.config.ts",
  "vision.config.mts",
  "vision.config.mjs",
  "vision.config.js",
  "vision.config.cjs",
  "vision.config.json"
] as const;

export interface LoadedConfig {
  readonly config: VisionConfig;
  readonly configPath: string | undefined;
}

export async function loadConfig(rootDir: string, explicitPath?: string): Promise<LoadedConfig> {
  const configPath = explicitPath === undefined ? await findConfig(rootDir) : path.resolve(rootDir, explicitPath);
  if (configPath === undefined) {
    return { config: DEFAULT_CONFIG, configPath: undefined };
  }

  if (!(await pathExists(configPath))) {
    throw new VisionError("CONFIG_NOT_FOUND", "Vision config was not found.", {
      reason: `No config exists at ${configPath}.`,
      suggestion: "Run vision-sync init or pass a valid --config path.",
      filePath: configPath
    });
  }

  const loaded = await loadConfigModule(rootDir, configPath);
  return {
    config: deepMerge<VisionConfig>(DEFAULT_CONFIG, loaded),
    configPath
  };
}

export async function findConfig(rootDir: string): Promise<string | undefined> {
  for (const candidate of CONFIG_CANDIDATES) {
    const absolutePath = path.resolve(rootDir, candidate);
    if (await pathExists(absolutePath)) {
      return absolutePath;
    }
  }

  return undefined;
}

async function loadConfigModule(rootDir: string, configPath: string): Promise<ConfigInput> {
  if (configPath.endsWith(".json")) {
    const json = await readJsonIfExists(configPath);
    return assertConfigInput(json, configPath);
  }

  const importPath = configPath.endsWith(".ts") || configPath.endsWith(".mts")
    ? await transpileConfig(rootDir, configPath)
    : configPath;

  const moduleUrl = `${pathToFileURL(importPath).href}?v=${Date.now()}`;
  const imported = await import(moduleUrl) as unknown;
  if (!isRecord(imported)) {
    throw invalidConfig(configPath, "The config module did not export an object.");
  }

  const exported = imported.default ?? imported.config;
  return assertConfigInput(exported, configPath);
}

async function transpileConfig(rootDir: string, configPath: string): Promise<string> {
  const source = await readFile(configPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
      strict: true
    },
    fileName: configPath,
    reportDiagnostics: true
  });

  const diagnostics = output.diagnostics ?? [];
  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    const reason = first === undefined
      ? "TypeScript reported a config transpilation problem."
      : ts.flattenDiagnosticMessageText(first.messageText, "\n");
    throw invalidConfig(configPath, reason);
  }

  const cacheDir = path.resolve(rootDir, ".vision", "cache");
  await mkdir(cacheDir, { recursive: true });
  const cachePath = path.join(cacheDir, `vision.config.${sha256(source)}.mjs`);
  await writeFile(cachePath, output.outputText, "utf8");
  return cachePath;
}

function assertConfigInput(value: unknown, configPath: string): ConfigInput {
  if (!isRecord(value)) {
    throw invalidConfig(configPath, "The config export must be an object.");
  }

  return defineConfig(value as ConfigInput);
}

function invalidConfig(configPath: string, reason: string): VisionError {
  return new VisionError("CONFIG_INVALID", "Vision config is invalid.", {
    reason,
    suggestion: "Open the config file, fix the highlighted structure, then run vision-sync sync again.",
    filePath: configPath
  });
}
