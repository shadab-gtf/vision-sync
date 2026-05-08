import path from "node:path";
import { generateClientSource } from "./client-generator.js";
import { wrapGeneratedContent } from "./generated-file.js";
import { generateHooksSource } from "./hooks-generator.js";
import { generateModuleSources } from "./module-generator.js";
import { generateTypesSource } from "./types-generator.js";
import type { VisionConfig } from "../types/config.js";
import type { OpenApiDocument, SchemaDigest } from "../types/openapi.js";
import type { DetectionResult } from "../types/project.js";
import type { WriteIntent } from "../types/safety.js";

export interface GenerationPlan {
  readonly intents: readonly WriteIntent[];
  readonly skipped: readonly string[];
}

export function createGenerationPlan(
  config: VisionConfig,
  detection: DetectionResult,
  document: OpenApiDocument,
  digest: SchemaDigest
): GenerationPlan {
  const outputDir = path.resolve(detection.rootDir, config.output.baseDir);
  const intents: WriteIntent[] = [];
  const skipped: string[] = [];
  const queryLibrary = config.generators.queryLibrary === "auto"
    ? detection.capabilities.tanstackQuery ? "tanstack-query" : "none"
    : config.generators.queryLibrary;

  if (config.generators.emitTypes) {
    intents.push(generatedIntent(
      path.join(outputDir, config.output.typesFile),
      wrapGeneratedContent(config, generateTypesSource(document, digest), digest.checksum),
      "OpenAPI schema types"
    ));
  }

  if (config.generators.emitClient) {
    intents.push(generatedIntent(
      path.join(outputDir, config.output.clientFile),
      wrapGeneratedContent(config, generateClientSource(digest), digest.checksum),
      "OpenAPI fetch client"
    ));
  }

  if (config.generators.emitHooks && queryLibrary === "tanstack-query") {
    intents.push(generatedIntent(
      path.join(outputDir, config.output.hooksFile),
      wrapGeneratedContent(config, generateHooksSource(digest), digest.checksum),
      "TanStack Query hooks"
    ));
  } else if (config.generators.emitHooks) {
    skipped.push("Hooks skipped because TanStack Query was not detected and queryLibrary is auto/none.");
  }

  if (config.generators.emitModules) {
    for (const moduleFile of generateModuleSources(digest, config.output.modulesDir, queryLibrary === "tanstack-query")) {
      intents.push(generatedIntent(
        path.join(outputDir, moduleFile.relativePath),
        wrapGeneratedContent(config, moduleFile.source, digest.checksum),
        "Generated integration module"
      ));
    }
  }

  return { intents, skipped };
}

function generatedIntent(filePath: string, content: string, reason: string): WriteIntent {
  return {
    filePath,
    content,
    reason,
    ownership: "generated",
    allowOverwrite: true
  };
}
