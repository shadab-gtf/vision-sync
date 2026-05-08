import path from "node:path";
import { toKebabCase, toPascalCase } from "../utils/string.js";
import type { OperationModel, SchemaDigest } from "../types/openapi.js";

export interface GeneratedModuleFile {
  readonly relativePath: string;
  readonly source: string;
}

export function generateModuleSources(digest: SchemaDigest, modulesDir: string, includeHooks: boolean): readonly GeneratedModuleFile[] {
  const byTag = new Map<string, OperationModel[]>();

  for (const operation of digest.operations) {
    const tag = operation.tags[0] ?? "api";
    const existing = byTag.get(tag) ?? [];
    existing.push(operation);
    byTag.set(tag, existing);
  }

  const files: GeneratedModuleFile[] = [];
  for (const [tag, operations] of [...byTag.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const moduleName = toKebabCase(tag);
    const exports = operations
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((operation) => `  ${operation.id},`)
      .join("\n");
    const clientExports = `export {
${exports}
} from "../../client.js";`;

    const hookExports = operations
      .map((operation) => `  use${toPascalCase(operation.id)},`)
      .join("\n");
    const hookBlock = includeHooks ? `

export {
${hookExports}
} from "../../hooks.js";` : "";
    const source = `${clientExports}${hookBlock}`;

    files.push({
      relativePath: path.join(modulesDir, moduleName, "index.ts"),
      source
    });
  }

  return files;
}
