import { readdir } from "node:fs/promises";
import path from "node:path";
import { isRecord, isStringRecord } from "../types/json.js";
import { pathExists, readJsonIfExists } from "../utils/fs.js";
import type {
  DetectionResult,
  PackageJsonSnapshot,
  ProjectCapabilities
} from "../types/project.js";
import type { PackageManager, ProjectKind, RouterKind } from "../types/config.js";

export async function detectProject(rootDir: string): Promise<DetectionResult> {
  const packageJson = await readPackageJson(path.resolve(rootDir, "package.json"));
  const lockfiles = await detectLockfiles(rootDir);
  const packageManager = detectPackageManager(lockfiles);
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies
  };

  const next = dependencies.next !== undefined || await pathExists(path.resolve(rootDir, "next.config.js")) || await pathExists(path.resolve(rootDir, "next.config.mjs"));
  const nextAppRouter = await pathExists(path.resolve(rootDir, "app")) || await pathExists(path.resolve(rootDir, "src", "app"));
  const nextPagesRouter = await pathExists(path.resolve(rootDir, "pages")) || await pathExists(path.resolve(rootDir, "src", "pages"));
  const reactRouter = dependencies["react-router"] !== undefined || dependencies["react-router-dom"] !== undefined;
  const typescript = await pathExists(path.resolve(rootDir, "tsconfig.json"));
  const generatedFolders = await detectExistingFolders(rootDir, ["generated", "src/generated", "src/generated/vision"]);
  const apiFolders = await detectExistingFolders(rootDir, ["lib/api", "src/lib/api", "api", "src/api"]);
  const componentFolders = await detectExistingFolders(rootDir, ["components", "src/components"]);
  const capabilities: ProjectCapabilities = {
    typescript,
    next,
    nextAppRouter,
    nextPagesRouter,
    reactRouter,
    tailwind: dependencies.tailwindcss !== undefined || await pathExists(path.resolve(rootDir, "tailwind.config.js")) || await pathExists(path.resolve(rootDir, "tailwind.config.ts")),
    tanstackQuery: dependencies["@tanstack/react-query"] !== undefined,
    zustand: dependencies.zustand !== undefined,
    monorepo: await isMonorepo(rootDir, packageJson),
    existingApiLayer: apiFolders.length > 0,
    componentDriven: componentFolders.length > 0
  };

  return {
    rootDir: path.resolve(rootDir),
    packageManager,
    projectKind: detectProjectKind(next, dependencies.react !== undefined),
    routerKind: detectRouterKind(nextAppRouter, nextPagesRouter, reactRouter),
    importAlias: await detectImportAlias(rootDir),
    packageJson,
    capabilities,
    generatedFolders,
    apiFolders,
    componentFolders,
    lockfiles
  };
}

async function readPackageJson(filePath: string): Promise<PackageJsonSnapshot | undefined> {
  const value = await readJsonIfExists(filePath);
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    name: typeof value.name === "string" ? value.name : undefined,
    version: typeof value.version === "string" ? value.version : undefined,
    dependencies: isStringRecord(value.dependencies) ? value.dependencies : {},
    devDependencies: isStringRecord(value.devDependencies) ? value.devDependencies : {},
    scripts: isStringRecord(value.scripts) ? value.scripts : {}
  };
}

async function detectLockfiles(rootDir: string): Promise<readonly string[]> {
  const candidates = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb"];
  const found: string[] = [];

  for (const candidate of candidates) {
    if (await pathExists(path.resolve(rootDir, candidate))) {
      found.push(candidate);
    }
  }

  return found;
}

function detectPackageManager(lockfiles: readonly string[]): PackageManager {
  if (lockfiles.includes("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (lockfiles.includes("yarn.lock")) {
    return "yarn";
  }
  if (lockfiles.includes("bun.lockb")) {
    return "bun";
  }
  if (lockfiles.includes("package-lock.json")) {
    return "npm";
  }
  return "unknown";
}

function detectProjectKind(next: boolean, react: boolean): ProjectKind {
  if (next) {
    return "next";
  }

  return react ? "react" : "unknown";
}

function detectRouterKind(nextAppRouter: boolean, nextPagesRouter: boolean, reactRouter: boolean): RouterKind {
  if (nextAppRouter) {
    return "next-app";
  }
  if (nextPagesRouter) {
    return "next-pages";
  }
  if (reactRouter) {
    return "react-router";
  }
  return "unknown";
}

async function detectExistingFolders(rootDir: string, candidates: readonly string[]): Promise<readonly string[]> {
  const folders: string[] = [];

  for (const candidate of candidates) {
    if (await pathExists(path.resolve(rootDir, candidate))) {
      folders.push(candidate);
    }
  }

  return folders;
}

async function isMonorepo(rootDir: string, packageJson: PackageJsonSnapshot | undefined): Promise<boolean> {
  if (await pathExists(path.resolve(rootDir, "pnpm-workspace.yaml")) || await pathExists(path.resolve(rootDir, "turbo.json"))) {
    return true;
  }

  if (packageJson === undefined) {
    return false;
  }

  const raw = await readJsonIfExists(path.resolve(rootDir, "package.json"));
  return isRecord(raw) && Array.isArray(raw.workspaces);
}

async function detectImportAlias(rootDir: string): Promise<string | undefined> {
  const tsconfig = await readJsonIfExists(path.resolve(rootDir, "tsconfig.json"));
  if (!isRecord(tsconfig) || !isRecord(tsconfig.compilerOptions) || !isRecord(tsconfig.compilerOptions.paths)) {
    return undefined;
  }

  for (const key of Object.keys(tsconfig.compilerOptions.paths)) {
    const values = tsconfig.compilerOptions.paths[key];
    if (!Array.isArray(values) || values.length === 0) {
      continue;
    }

    const first = values[0];
    if (typeof first === "string" && first.includes("src")) {
      return key.endsWith("/*") ? key.slice(0, -2) : key;
    }
  }

  return undefined;
}

export async function listWorkspaceEntries(rootDir: string): Promise<readonly string[]> {
  try {
    return await readdir(rootDir);
  } catch {
    return [];
  }
}
