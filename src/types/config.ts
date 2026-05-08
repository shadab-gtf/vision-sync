import type { DeepPartial } from "./utility.js";

export type ProjectKind = "next" | "react" | "unknown";

export type RouterKind = "next-app" | "next-pages" | "react-router" | "unknown";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun" | "unknown";

export type IntegrationLevel = 1 | 2 | 3 | 4;

export type GenerationMode = "conservative" | "standard" | "advanced" | "preview";

export type SchemaSource =
  | {
      readonly type: "url";
      readonly url: string;
      readonly headers?: Readonly<Record<string, string>>;
    }
  | {
      readonly type: "file";
      readonly path: string;
    };

export type ModuleOwnership = "generated" | "developer-owned" | "protected" | "temporary";

export type AstPermission =
  | "ensure-import"
  | "create-generated-region"
  | "replace-generated-region"
  | "inject-props";

export interface OutputConfig {
  readonly baseDir: string;
  readonly typesFile: string;
  readonly clientFile: string;
  readonly hooksFile: string;
  readonly modulesDir: string;
  readonly useSrcDir: boolean;
}

export interface SafetyConfig {
  readonly safeMode: boolean;
  readonly readonlyMode: boolean;
  readonly previewMode: boolean;
  readonly dryRunByDefault: boolean;
  readonly requireConfirmation: boolean;
  readonly backups: boolean;
  readonly rollback: boolean;
  readonly rollbackRetention: number;
  readonly checksumValidation: boolean;
  readonly atomicWrites: boolean;
  readonly protectedFolders: readonly string[];
  readonly ignoredFolders: readonly string[];
  readonly generatedMarkers: {
    readonly start: string;
    readonly end: string;
  };
}

export interface IntegrationConfig {
  readonly level: IntegrationLevel;
  readonly mode: GenerationMode;
  readonly astEnabled: boolean;
  readonly astPreviewOnly: boolean;
  readonly transformationPermissions: readonly AstPermission[];
  readonly integrationBoundaries: readonly string[];
  readonly ignoredComponents: readonly string[];
}

export interface NamingConfig {
  readonly operationIdStrategy: "operationId" | "methodPath";
  readonly hookPrefix: string;
  readonly clientSuffix: string;
  readonly typeSuffix: string;
}

export interface GeneratorConfig {
  readonly queryLibrary: "tanstack-query" | "none" | "auto";
  readonly emitHooks: boolean;
  readonly emitClient: boolean;
  readonly emitTypes: boolean;
  readonly emitModules: boolean;
  readonly customGenerators: readonly string[];
  readonly naming: NamingConfig;
}

export interface ProjectConfig {
  readonly rootDir: string;
  readonly packageManager: PackageManager;
  readonly importAlias: string | undefined;
  readonly framework: ProjectKind;
  readonly router: RouterKind;
}

export interface FormattingConfig {
  readonly indent: "  " | "\t";
  readonly lineEnding: "\n" | "\r\n";
  readonly finalNewline: boolean;
}

export interface VisionConfig {
  readonly schema: SchemaSource | undefined;
  readonly output: OutputConfig;
  readonly safety: SafetyConfig;
  readonly integration: IntegrationConfig;
  readonly generators: GeneratorConfig;
  readonly project: ProjectConfig;
  readonly formatting: FormattingConfig;
}

export type ConfigInput = DeepPartial<VisionConfig>;
