import type { DetectionResult } from "../types/project.js";
import type { GenerationMode, IntegrationLevel } from "../types/config.js";

export interface InitAnswers {
  readonly schema: string | undefined;
  readonly output: string;
  readonly rollback: boolean;
  readonly safeMode: boolean;
  readonly level: IntegrationLevel;
  readonly mode: GenerationMode;
}

export function createConfigTemplate(detection: DetectionResult, answers: InitAnswers): string {
  const schemaBlock = schemaSourceBlock(answers.schema);
  const queryLibrary = detection.capabilities.tanstackQuery ? "tanstack-query" : "auto";

  return `import { defineConfig } from "vision-sync";

export default defineConfig({
${schemaBlock}
  output: {
    baseDir: ${JSON.stringify(answers.output)}
  },
  safety: {
    safeMode: ${answers.safeMode},
    previewMode: true,
    dryRunByDefault: true,
    backups: true,
    rollback: ${answers.rollback}
  },
  integration: {
    level: ${answers.level},
    mode: ${JSON.stringify(answers.mode)},
    astEnabled: false,
    astPreviewOnly: true
  },
  generators: {
    queryLibrary: ${JSON.stringify(queryLibrary)},
    emitHooks: true,
    emitClient: true,
    emitTypes: true,
    emitModules: ${answers.level >= 2}
  }
});
`;
}

function schemaSourceBlock(schema: string | undefined): string {
  if (schema === undefined || schema.trim().length === 0) {
    return "";
  }

  const trimmed = schema.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `  schema: {
    type: "url",
    url: ${JSON.stringify(trimmed)}
  },
`;
  }

  return `  schema: {
    type: "file",
    path: ${JSON.stringify(trimmed)}
  },
`;
}
