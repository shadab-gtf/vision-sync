import { paramsTypeName, responseTypeName } from "../schema/schema-model.js";
import { operationRequiresParams, propertyAccessor } from "./parameter-types.js";
import { quoteString } from "../utils/string.js";
import type { OperationModel, ParameterModel, SchemaDigest } from "../types/openapi.js";

export function generateClientSource(digest: SchemaDigest): string {
  const typeImports = digest.operations
    .flatMap((operation) => [paramsTypeName(operation), responseTypeName(operation)])
    .sort();
  const sections = [
    typeImports.length > 0 ? `import type { ${typeImports.join(", ")} } from "./types.js";` : undefined,
    SHARED_CLIENT_SOURCE,
    ...digest.operations.map(emitOperationClient)
  ].filter((section): section is string => section !== undefined);

  return sections.join("\n\n");
}

const SHARED_CLIENT_SOURCE = `export type VisionPrimitive = string | number | boolean;
export type VisionQueryValue = VisionPrimitive | null | undefined | readonly VisionPrimitive[];

export interface VisionRequestOptions {
  readonly baseUrl?: string;
  readonly signal?: AbortSignal;
  readonly headers?: HeadersInit;
  readonly fetcher?: typeof fetch;
}

export interface VisionRequestConfig {
  readonly method: string;
  readonly path: string;
  readonly query?: Readonly<Record<string, VisionQueryValue>>;
  readonly headers?: Readonly<Record<string, VisionQueryValue>>;
  readonly body?: unknown;
}

export class VisionApiError extends Error {
  public readonly status: number;
  public readonly response: Response;

  public constructor(response: Response) {
    super(\`Vision API request failed with HTTP \${response.status}\`);
    this.name = "VisionApiError";
    this.status = response.status;
    this.response = response;
  }
}

export async function visionFetch<TResponse>(
  config: VisionRequestConfig,
  options: VisionRequestOptions = {}
): Promise<TResponse> {
  const fetcher = options.fetcher ?? fetch;
  const url = buildUrl(options.baseUrl ?? "", config.path, config.query);
  const headers = new Headers(options.headers);
  appendHeaders(headers, config.headers);

  const init: RequestInit = {
    method: config.method,
    headers
  };

  if (options.signal !== undefined) {
    init.signal = options.signal;
  }

  if (config.body !== undefined) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    init.body = JSON.stringify(config.body);
  }

  const response = await fetcher(url, init);
  if (!response.ok) {
    throw new VisionApiError(response);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload: unknown = await response.json();
    return payload as TResponse;
  }

  const text = await response.text();
  return text as TResponse;
}

function buildUrl(baseUrl: string, requestPath: string, query: Readonly<Record<string, VisionQueryValue>> | undefined): string {
  const url = new URL(requestPath, baseUrl.length > 0 ? baseUrl : "http://vision.local");
  appendQuery(url.searchParams, query);
  return baseUrl.length > 0 ? url.toString() : \`\${url.pathname}\${url.search}\`;
}

function appendQuery(searchParams: URLSearchParams, query: Readonly<Record<string, VisionQueryValue>> | undefined): void {
  if (query === undefined) {
    return;
  }

  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(searchParams, key, value);
  }
}

function appendHeaders(headers: Headers, values: Readonly<Record<string, VisionQueryValue>> | undefined): void {
  if (values === undefined) {
    return;
  }

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || Array.isArray(value)) {
      continue;
    }
    headers.set(key, String(value));
  }
}

function appendQueryValue(searchParams: URLSearchParams, key: string, value: VisionQueryValue): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      searchParams.append(key, String(entry));
    }
    return;
  }

  searchParams.set(key, String(value));
}`;

function emitOperationClient(operation: OperationModel): string {
  const paramsType = paramsTypeName(operation);
  const responseType = responseTypeName(operation);
  const requiresParams = operationRequiresParams(operation);
  const paramsDeclaration = requiresParams ? `params: ${paramsType}` : `params: ${paramsType} = {}`;
  const pathExpression = buildPathExpression(operation.path, operation.parameters);
  const queryLine = hasLocation(operation.parameters, "query") ? "    query: params.query," : undefined;
  const headerLine = hasLocation(operation.parameters, "header") ? "    headers: params.headers," : undefined;
  const bodyLine = operation.requestBodyType !== undefined ? "    body: params.body," : undefined;
  const configLines = [
    `    method: ${quoteString(operation.method.toUpperCase())},`,
    `    path: ${pathExpression},`,
    queryLine,
    headerLine,
    bodyLine
  ].filter((line): line is string => line !== undefined);

  return `export async function ${operation.id}(
  ${paramsDeclaration},
  options: VisionRequestOptions = {}
): Promise<${responseType}> {
  return visionFetch<${responseType}>({
${configLines.join("\n")}
  }, options);
}`;
}

function buildPathExpression(pathTemplate: string, parameters: readonly ParameterModel[]): string {
  const pathParams = new Set(parameters.filter((parameter) => parameter.location === "path").map((parameter) => parameter.name));
  const parts: string[] = [];
  let cursor = "";
  let parameterName = "";
  let inParameter = false;

  for (const character of pathTemplate) {
    if (character === "{" && !inParameter) {
      if (cursor.length > 0) {
        parts.push(cursor);
        cursor = "";
      }
      inParameter = true;
      parameterName = "";
      continue;
    }

    if (character === "}" && inParameter) {
      if (pathParams.has(parameterName)) {
        parts.push(`\${encodeURIComponent(String(${propertyAccessor("params.path", parameterName)}))}`);
      } else {
        parts.push(`{${parameterName}}`);
      }
      inParameter = false;
      continue;
    }

    if (inParameter) {
      parameterName += character;
    } else {
      cursor += character;
    }
  }

  if (cursor.length > 0) {
    parts.push(cursor);
  }

  return parts.some((part) => part.startsWith("${")) ? `\`${parts.join("")}\`` : quoteString(pathTemplate);
}

function hasLocation(parameters: readonly ParameterModel[], location: ParameterModel["location"]): boolean {
  return parameters.some((parameter) => parameter.location === location);
}
