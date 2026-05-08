import type {
  OpenApiDocument,
  OpenApiReferenceObject,
  OpenApiSchemaObject,
  OpenApiSchemaReference
} from "../types/openapi.js";
import { isRecord } from "../types/json.js";
import { quoteString, sanitizeIdentifier, toPascalCase } from "../utils/string.js";

export function schemaToType(schema: OpenApiSchemaReference | undefined, document: OpenApiDocument): string {
  if (schema === undefined) {
    return "unknown";
  }

  if (isReference(schema)) {
    return referenceToTypeName(schema.$ref);
  }

  if (schema.const !== undefined) {
    return literalToType(schema.const);
  }

  if (schema.enum !== undefined && schema.enum.length > 0) {
    return schema.enum.map((entry) => literalToType(entry)).join(" | ");
  }

  if (schema.allOf !== undefined && schema.allOf.length > 0) {
    return schema.allOf.map((entry) => wrapComposite(schemaToType(entry, document))).join(" & ");
  }

  if (schema.oneOf !== undefined && schema.oneOf.length > 0) {
    return schema.oneOf.map((entry) => wrapComposite(schemaToType(entry, document))).join(" | ");
  }

  if (schema.anyOf !== undefined && schema.anyOf.length > 0) {
    return schema.anyOf.map((entry) => wrapComposite(schemaToType(entry, document))).join(" | ");
  }

  const type = schema.type;
  const normalizedTypes = Array.isArray(type) ? type : type === undefined ? [] : [type];
  const nullable = schema.nullable === true || normalizedTypes.includes("null");
  const withoutNull = normalizedTypes.filter((entry) => entry !== "null");
  const baseType = typeListToType(withoutNull, schema, document);
  return nullable && baseType !== "null" ? `${baseType} | null` : baseType;
}

export function emitSchemaDeclarations(document: OpenApiDocument): string {
  const schemas = document.components?.schemas ?? {};
  const declarations: string[] = [];

  for (const [rawName, schema] of Object.entries(schemas).sort(([left], [right]) => left.localeCompare(right))) {
    const typeName = toPascalCase(rawName);
    const typeNode = schemaToType(schema, document);
    const declaration = typeNode.trim().startsWith("{")
      ? `export interface ${typeName} ${typeNode}`
      : `export type ${typeName} = ${typeNode};`;
    declarations.push(declaration);
  }

  return declarations.join("\n\n");
}

export function referenceToTypeName(ref: string): string {
  const segments = ref.split("/");
  const last = segments[segments.length - 1];
  return toPascalCase(decodeReferenceSegment(last ?? "Schema"));
}

export function isReference(value: OpenApiSchemaReference | OpenApiReferenceObject | unknown): value is OpenApiReferenceObject {
  return isRecord(value) && typeof value.$ref === "string";
}

function typeListToType(types: readonly string[], schema: OpenApiSchemaObject, document: OpenApiDocument): string {
  if (types.length > 1) {
    return types.map((entry) => typeListToType([entry], schema, document)).join(" | ");
  }

  const type = types[0];
  switch (type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return `ReadonlyArray<${schemaToType(schema.items, document)}>`;
    case "object":
      return objectSchemaToType(schema, document);
    case "null":
      return "null";
    case undefined:
      return inferUntypedSchema(schema, document);
    default:
      return "unknown";
  }
}

function inferUntypedSchema(schema: OpenApiSchemaObject, document: OpenApiDocument): string {
  if (schema.properties !== undefined || schema.additionalProperties !== undefined) {
    return objectSchemaToType(schema, document);
  }

  if (schema.items !== undefined) {
    return `ReadonlyArray<${schemaToType(schema.items, document)}>`;
  }

  return "unknown";
}

function objectSchemaToType(schema: OpenApiSchemaObject, document: OpenApiDocument): string {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const lines: string[] = ["{"];

  for (const [propertyName, propertySchema] of Object.entries(properties).sort(([left], [right]) => left.localeCompare(right))) {
    const optional = required.has(propertyName) ? "" : "?";
    lines.push(`  readonly ${propertyKey(propertyName)}${optional}: ${schemaToType(propertySchema, document)};`);
  }

  if (schema.additionalProperties !== undefined && schema.additionalProperties !== false) {
    const valueType = schema.additionalProperties === true
      ? "unknown"
      : schemaToType(schema.additionalProperties, document);
    lines.push(`  readonly [key: string]: ${valueType};`);
  }

  lines.push("}");
  return lines.join("\n");
}

function propertyKey(value: string): string {
  const identifier = sanitizeIdentifier(value, "property");
  return identifier === value ? value : quoteString(value);
}

function literalToType(value: unknown): string {
  if (typeof value === "string") {
    return quoteString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  return "unknown";
}

function wrapComposite(value: string): string {
  return value.includes("\n") ? `(${value})` : value;
}

function decodeReferenceSegment(value: string): string {
  return value.split("~1").join("/").split("~0").join("~");
}
