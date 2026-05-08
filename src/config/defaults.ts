import type { VisionConfig } from "../types/config.js";

export const DEFAULT_CONFIG: VisionConfig = {
  schema: undefined,
  output: {
    baseDir: "src/generated/vision",
    typesFile: "types.ts",
    clientFile: "client.ts",
    hooksFile: "hooks.ts",
    modulesDir: "modules",
    useSrcDir: true
  },
  safety: {
    safeMode: true,
    readonlyMode: false,
    previewMode: true,
    dryRunByDefault: true,
    requireConfirmation: true,
    backups: true,
    rollback: true,
    rollbackRetention: 20,
    checksumValidation: true,
    atomicWrites: true,
    protectedFolders: [
      "app",
      "pages",
      "components",
      "src/app",
      "src/pages",
      "src/components",
      "developer-owned",
      "protected"
    ],
    ignoredFolders: ["node_modules", ".next", "dist", "build", ".git"],
    generatedMarkers: {
      start: "@vision-generated-start",
      end: "@vision-generated-end"
    }
  },
  integration: {
    level: 1,
    mode: "conservative",
    astEnabled: false,
    astPreviewOnly: true,
    transformationPermissions: ["ensure-import", "replace-generated-region"],
    integrationBoundaries: ["src/generated", "generated"],
    ignoredComponents: []
  },
  generators: {
    queryLibrary: "auto",
    emitHooks: true,
    emitClient: true,
    emitTypes: true,
    emitModules: false,
    customGenerators: [],
    naming: {
      operationIdStrategy: "operationId",
      hookPrefix: "use",
      clientSuffix: "",
      typeSuffix: ""
    }
  },
  project: {
    rootDir: ".",
    packageManager: "unknown",
    importAlias: undefined,
    framework: "unknown",
    router: "unknown"
  },
  formatting: {
    indent: "  ",
    lineEnding: "\n",
    finalNewline: true
  }
};
