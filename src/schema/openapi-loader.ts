import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { VisionError } from "../errors/vision-error.js";
import { isRecord } from "../types/json.js";
import type { OpenApiDocument } from "../types/openapi.js";
import type { SchemaSource } from "../types/config.js";

export async function loadOpenApiDocument(rootDir: string, source: SchemaSource | undefined): Promise<OpenApiDocument> {
  if (source === undefined) {
    throw new VisionError("SCHEMA_NOT_FOUND", "No OpenAPI schema source was configured.", {
      reason: "vision.config.ts does not define schema.",
      suggestion: "Run vision-sync init or pass --schema with a URL or file path."
    });
  }

  const content = source.type === "url"
    ? await fetchSchemaFromUrl(source.url, source.headers)
    : await readFile(path.resolve(rootDir, source.path), "utf8");

  const parsed = parseSchemaContent(content, source.type === "file" ? source.path : source.url);
  return assertOpenApiDocument(parsed, source.type === "file" ? source.path : source.url);
}

export function parseSchemaContent(content: string, label: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    try {
      return YAML.parse(content) as unknown;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Schema content could not be parsed as JSON or YAML.";
      throw new VisionError("SCHEMA_INVALID", "OpenAPI schema could not be parsed.", {
        reason,
        suggestion: "Verify the schema is valid JSON or YAML, then run vision-sync sync again.",
        filePath: label
      });
    }
  }
}

export function assertOpenApiDocument(value: unknown, label: string): OpenApiDocument {
  if (!isRecord(value)) {
    throw invalidSchema(label, "The schema root must be an object.");
  }

  const version = typeof value.openapi === "string" ? value.openapi : typeof value.swagger === "string" ? value.swagger : undefined;
  if (version === undefined) {
    throw invalidSchema(label, "The schema must include openapi or swagger version metadata.");
  }

  if (!isRecord(value.paths)) {
    throw invalidSchema(label, "The schema must include a paths object.");
  }

  return value as unknown as OpenApiDocument;
}

async function fetchSchemaFromUrl(url: string, headers: Readonly<Record<string, string>> | undefined): Promise<string> {
  const init: RequestInit = headers === undefined ? {} : { headers: { ...headers } };
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new VisionError("SCHEMA_NOT_FOUND", "OpenAPI schema request failed.", {
      reason: `The schema URL returned HTTP ${response.status}.`,
      suggestion: "Check the URL or pass a local schema file with --schema.",
      filePath: url
    });
  }

  return await response.text();
}

function invalidSchema(label: string, reason: string): VisionError {
  return new VisionError("SCHEMA_INVALID", "OpenAPI schema is invalid.", {
    reason,
    suggestion: "Fix the schema or choose preview mode to inspect the failure safely.",
    filePath: label
  });
}
