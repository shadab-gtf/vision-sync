import { paramsTypeName, responseTypeName } from "../schema/schema-model.js";
import { operationRequiresParams } from "./parameter-types.js";
import { toPascalCase } from "../utils/string.js";
import type { OperationModel, SchemaDigest } from "../types/openapi.js";

export function generateHooksSource(digest: SchemaDigest): string {
  if (digest.operations.length === 0) {
    return "export {};";
  }

  const typeImports = digest.operations
    .flatMap((operation) => [paramsTypeName(operation), responseTypeName(operation)])
    .sort();
  const clientImports = digest.operations.map((operation) => operation.id).sort();
  const sections = [
    `import { useMutation, useQuery } from "@tanstack/react-query";`,
    `import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";`,
    `import { ${clientImports.join(", ")} } from "./client.js";`,
    `import type { ${typeImports.join(", ")} } from "./types.js";`,
    ...digest.operations.map(emitHook)
  ];

  return sections.join("\n\n");
}

function emitHook(operation: OperationModel): string {
  return operation.method === "get" || operation.method === "head"
    ? emitQueryHook(operation)
    : emitMutationHook(operation);
}

function emitQueryHook(operation: OperationModel): string {
  const paramsType = paramsTypeName(operation);
  const responseType = responseTypeName(operation);
  const hookName = `use${toPascalCase(operation.id)}`;
  const queryKeyName = `${operation.id}QueryKey`;
  const requiresParams = operationRequiresParams(operation);
  const paramsDeclaration = requiresParams ? `params: ${paramsType}` : `params: ${paramsType} = {}`;

  return `export const ${queryKeyName} = (params${requiresParams ? "" : "?"}: ${paramsType}) => [${JSON.stringify(operation.id)}, params] as const;

export function ${hookName}(
  ${paramsDeclaration},
  options?: Omit<UseQueryOptions<${responseType}, Error, ${responseType}, ReturnType<typeof ${queryKeyName}>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ${queryKeyName}(params),
    queryFn: () => ${operation.id}(params),
    ...options
  });
}`;
}

function emitMutationHook(operation: OperationModel): string {
  const paramsType = paramsTypeName(operation);
  const responseType = responseTypeName(operation);
  const hookName = `use${toPascalCase(operation.id)}`;

  return `export function ${hookName}(
  options?: UseMutationOptions<${responseType}, Error, ${paramsType}>
) {
  return useMutation({
    mutationFn: ${operation.id},
    ...options
  });
}`;
}
