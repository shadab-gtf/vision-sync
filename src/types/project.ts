import type { PackageManager, ProjectKind, RouterKind } from "./config.js";

export interface PackageJsonSnapshot {
  readonly name: string | undefined;
  readonly version: string | undefined;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
  readonly scripts: Readonly<Record<string, string>>;
}

export interface ProjectCapabilities {
  readonly typescript: boolean;
  readonly next: boolean;
  readonly nextAppRouter: boolean;
  readonly nextPagesRouter: boolean;
  readonly reactRouter: boolean;
  readonly tailwind: boolean;
  readonly tanstackQuery: boolean;
  readonly zustand: boolean;
  readonly monorepo: boolean;
  readonly existingApiLayer: boolean;
  readonly componentDriven: boolean;
}

export interface DetectionResult {
  readonly rootDir: string;
  readonly packageManager: PackageManager;
  readonly projectKind: ProjectKind;
  readonly routerKind: RouterKind;
  readonly importAlias: string | undefined;
  readonly packageJson: PackageJsonSnapshot | undefined;
  readonly capabilities: ProjectCapabilities;
  readonly generatedFolders: readonly string[];
  readonly apiFolders: readonly string[];
  readonly componentFolders: readonly string[];
  readonly lockfiles: readonly string[];
}
