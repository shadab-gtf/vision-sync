import ts from "typescript";
import { VisionError } from "../errors/vision-error.js";
import type { WriteIntent } from "../types/safety.js";

export function validateGeneratedIntents(intents: readonly WriteIntent[]): void {
  for (const intent of intents) {
    if (!intent.filePath.endsWith(".ts") && !intent.filePath.endsWith(".tsx")) {
      continue;
    }

    const result = ts.transpileModule(intent.content, {
      fileName: intent.filePath,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        strict: true
      }
    });
    const diagnostics = result.diagnostics ?? [];
    if (diagnostics.length === 0) {
      continue;
    }

    const first = diagnostics[0];
    throw new VisionError("VALIDATION_FAILED", "Generated TypeScript failed validation.", {
      reason: first === undefined
        ? "TypeScript reported a validation diagnostic."
        : ts.flattenDiagnosticMessageText(first.messageText, "\n"),
      suggestion: "No files were modified. Inspect the schema shape or run preview mode with a smaller schema subset.",
      filePath: intent.filePath
    });
  }
}
