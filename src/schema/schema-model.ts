import { sha256 } from "../utils/checksum.js";
import { stableStringify } from "../utils/stable-stringify.js";
import { sanitizeIdentifier, toCamelCase, toPascalCase } from "../utils/string.js";
import { isReference, referenceToTypeName, schemaToType } from "./schema-to-ts.js";
import type {
  HttpMethod,
  OpenApiDocument,
  OpenApiOperationObject,
  OpenApiParameterObject,
  OpenApiPathItemObject,
  OpenApiReferenceObject,
  OpenApiRequestBodyObject,
  OpenApiResponseObject,
  OpenApiSchemaReference,
  OperationModel,
  ParameterModel,
  SchemaDigest
} from "../types/openapi.js";

const HTTP_METHODS: readonly HttpMethod[] = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

export function createSchemaDigest(document: OpenApiDocument): SchemaDigest {
  const operations = createOperationModels(document);
  const entityNames = Object.keys(document.components?.schemas ?? {}).map(toPascalCase).sort();

  return {
    checksum: sha256(stableStringify(document)),
    title: document.info?.title,
    version: document.info?.version,
    endpointCount: operations.length,
    entityCount: entityNames.length,
    operations,
    entityNames
  };
}

export function createOperationModels(document: OpenApiDocument): readonly OperationModel[] {
  const paths = document.paths ?? {};
  const operations: OperationModel[] = [];

  for (const [pathName, pathItem] of Object.entries(paths).sort(([left], [right]) => left.localeCompare(right))) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (operation === undefined) {
        continue;
      }

      operations.push(createOperationModel(document, pathName, pathItem, method, operation));
    }
  }

  return operations.sort((left, right) => left.id.localeCompare(right.id));
}

function createOperationModel(
  document: OpenApiDocument,
  pathName: string,
  pathItem: OpenApiPathItemObject,
  method: HttpMethod,
  operation: OpenApiOperationObject
): OperationModel {
  const operationId = operation.operationId === undefined || operation.operationId.length === 0
    ? `${method} ${pathName}`
    : operation.operationId;
  const parameters = [
    ...(pathItem.parameters ?? []),
    ...(operation.parameters ?? [])
  ]
    .map((parameter) => resolveParameter(document, parameter))
    .filter((parameter): parameter is OpenApiParameterObject => parameter !== undefined)
    .map((parameter) => createParameterModel(document, parameter));

  const requestBody = resolveRequestBody(document, operation.requestBody);
  const requestBodySchema = firstContentSchema(requestBody?.content);
  const response = selectSuccessResponse(document, operation.responses);
  const responseSchema = firstContentSchema(response?.content);

  return {
    id: sanitizeIdentifier(toCamelCase(operationId), "operation"),
    method,
    path: pathName,
    tags: operation.tags ?? [],
    summary: operation.summary,
    parameters,
    requestBodyType: requestBodySchema === undefined ? undefined : schemaToType(requestBodySchema, document),
    requestBodyRequired: requestBody?.required === true,
    responseType: responseSchema === undefined ? "unknown" : schemaToType(responseSchema, document)
  };
}

function createParameterModel(document: OpenApiDocument, parameter: OpenApiParameterObject): ParameterModel {
  return {
    name: parameter.name,
    location: parameter.in,
    required: parameter.required === true || parameter.in === "path",
    typeNode: schemaToType(parameter.schema, document)
  };
}

function resolveParameter(
  document: OpenApiDocument,
  parameter: OpenApiParameterObject | OpenApiReferenceObject
): OpenApiParameterObject | undefined {
  if (!isReference(parameter)) {
    return parameter;
  }

  const resolved = resolveReference(document, parameter.$ref);
  return isParameterObject(resolved) ? resolved : undefined;
}

function resolveRequestBody(
  document: OpenApiDocument,
  requestBody: OpenApiRequestBodyObject | OpenApiReferenceObject | undefined
): OpenApiRequestBodyObject | undefined {
  if (requestBody === undefined) {
    return undefined;
  }

  if (!isReference(requestBody)) {
    return requestBody;
  }

  const resolved = resolveReference(document, requestBody.$ref);
  return isRequestBodyObject(resolved) ? resolved : undefined;
}

function selectSuccessResponse(
  document: OpenApiDocument,
  responses: Readonly<Record<string, OpenApiResponseObject | OpenApiReferenceObject>> | undefined
): OpenApiResponseObject | undefined {
  if (responses === undefined) {
    return undefined;
  }

  const preferredCodes = ["200", "201", "202", "204", "default"];
  for (const code of preferredCodes) {
    const response = responses[code];
    const resolved = resolveResponse(document, response);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  for (const [code, response] of Object.entries(responses).sort(([left], [right]) => left.localeCompare(right))) {
    if (code.startsWith("2")) {
      const resolved = resolveResponse(document, response);
      if (resolved !== undefined) {
        return resolved;
      }
    }
  }

  return undefined;
}

function resolveResponse(
  document: OpenApiDocument,
  response: OpenApiResponseObject | OpenApiReferenceObject | undefined
): OpenApiResponseObject | undefined {
  if (response === undefined) {
    return undefined;
  }

  if (!isReference(response)) {
    return response;
  }

  const resolved = resolveReference(document, response.$ref);
  return isResponseObject(resolved) ? resolved : undefined;
}

function firstContentSchema(content: Readonly<Record<string, { readonly schema?: OpenApiSchemaReference }>> | undefined): OpenApiSchemaReference | undefined {
  if (content === undefined) {
    return undefined;
  }

  const preferred = content["application/json"]?.schema;
  if (preferred !== undefined) {
    return preferred;
  }

  const firstKey = Object.keys(content).sort()[0];
  return firstKey === undefined ? undefined : content[firstKey]?.schema;
}

function resolveReference(document: OpenApiDocument, ref: string): unknown {
  const segments = ref.split("/");
  if (segments[0] !== "#" || segments.length < 2) {
    return undefined;
  }

  let cursor: unknown = document;
  for (const rawSegment of segments.slice(1)) {
    const segment = rawSegment.split("~1").join("/").split("~0").join("~");
    if (typeof cursor !== "object" || cursor === null || Array.isArray(cursor)) {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return cursor;
}

function isParameterObject(value: unknown): value is OpenApiParameterObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as { readonly name?: unknown }).name === "string" && typeof (value as { readonly in?: unknown }).in === "string";
}

function isRequestBodyObject(value: unknown): value is OpenApiRequestBodyObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResponseObject(value: unknown): value is OpenApiResponseObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function responseTypeName(operation: OperationModel): string {
  return `${toPascalCase(operation.id)}Response`;
}

export function paramsTypeName(operation: OperationModel): string {
  return `${toPascalCase(operation.id)}Params`;
}

export function requestBodyTypeName(operation: OperationModel): string {
  return `${toPascalCase(operation.id)}RequestBody`;
}

export function referencedTypeName(schema: OpenApiSchemaReference): string | undefined {
  return isReference(schema) ? referenceToTypeName(schema.$ref) : undefined;
}
