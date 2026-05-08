import { emitSchemaDeclarations } from "../schema/schema-to-ts.js";
import { paramsTypeName, requestBodyTypeName, responseTypeName } from "../schema/schema-model.js";
import { emitParamsType } from "./parameter-types.js";
import type { OpenApiDocument, SchemaDigest } from "../types/openapi.js";

export function generateTypesSource(document: OpenApiDocument, digest: SchemaDigest): string {
  const sections: string[] = [];
  const entityDeclarations = emitSchemaDeclarations(document);
  if (entityDeclarations.length > 0) {
    sections.push(entityDeclarations);
  }

  for (const operation of digest.operations) {
    const lines = [
      emitParamsType(operation, paramsTypeName(operation))
    ];

    if (operation.requestBodyType !== undefined) {
      lines.push(`export type ${requestBodyTypeName(operation)} = ${operation.requestBodyType};`);
    }

    lines.push(`export type ${responseTypeName(operation)} = ${operation.responseType};`);
    sections.push(lines.join("\n\n"));
  }

  if (sections.length === 0) {
    return "export type VisionEmptySchema = Record<string, never>;";
  }

  return sections.join("\n\n");
}
