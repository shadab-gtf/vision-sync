export { defineConfig } from "./config/define-config.js";
export { DEFAULT_CONFIG } from "./config/defaults.js";
export { loadConfig } from "./config/load-config.js";
export { detectProject } from "./project/detect-project.js";
export { runSync } from "./engine/sync-engine.js";
export { SnapshotManager } from "./safety/snapshot-manager.js";
export { AstTransformationEngine } from "./ast/ast-transformation-engine.js";
export type {
  AstPermission,
  ConfigInput,
  GenerationMode,
  IntegrationLevel,
  ModuleOwnership,
  PackageManager,
  ProjectKind,
  RouterKind,
  SchemaSource,
  VisionConfig
} from "./types/config.js";
export type {
  DetectionResult,
  PackageJsonSnapshot,
  ProjectCapabilities
} from "./types/project.js";
export type {
  OpenApiDocument,
  OperationModel,
  SchemaDigest
} from "./types/openapi.js";
export type {
  SyncOptions,
  SyncResult
} from "./types/sync.js";
