import type { OperationModel, ParameterModel } from "../types/openapi.js";
import { quoteString, sanitizeIdentifier } from "../utils/string.js";

export function emitParamsType(operation: OperationModel, typeName: string): string {
  const pathType = emitGroupedParameterType(operation.parameters, "path");
  const queryType = emitGroupedParameterType(operation.parameters, "query");
  const headerType = emitGroupedParameterType(operation.parameters, "header");
  const cookieType = emitGroupedParameterType(operation.parameters, "cookie");
  const lines: string[] = [`export interface ${typeName} {`];

  appendGroupedProperty(lines, "path", pathType, hasRequiredParameters(operation.parameters, "path"));
  appendGroupedProperty(lines, "query", queryType, hasRequiredParameters(operation.parameters, "query"));
  appendGroupedProperty(lines, "headers", headerType, hasRequiredParameters(operation.parameters, "header"));
  appendGroupedProperty(lines, "cookies", cookieType, hasRequiredParameters(operation.parameters, "cookie"));

  if (operation.requestBodyType !== undefined) {
    lines.push(`  readonly body${operation.requestBodyRequired ? "" : "?"}: ${operation.requestBodyType};`);
  }

  if (lines.length === 1) {
    lines.push("  readonly _empty?: never;");
  }

  lines.push("}");
  return lines.join("\n");
}

export function operationRequiresParams(operation: OperationModel): boolean {
  return operation.requestBodyRequired || operation.parameters.some((parameter) => parameter.required);
}

export function propertyAccessor(objectName: string, propertyName: string): string {
  const identifier = sanitizeIdentifier(propertyName, "property");
  return identifier === propertyName ? `${objectName}.${propertyName}` : `${objectName}[${quoteString(propertyName)}]`;
}

function emitGroupedParameterType(
  parameters: readonly ParameterModel[],
  location: ParameterModel["location"]
): string | undefined {
  const group = parameters.filter((parameter) => parameter.location === location);
  if (group.length === 0) {
    return undefined;
  }

  const lines = ["{"];
  for (const parameter of group.sort((left, right) => left.name.localeCompare(right.name))) {
    const optional = parameter.required ? "" : "?";
    lines.push(`    readonly ${parameterKey(parameter.name)}${optional}: ${parameter.typeNode};`);
  }
  lines.push("  }");
  return lines.join("\n");
}

function appendGroupedProperty(lines: string[], name: string, typeNode: string | undefined, required: boolean): void {
  if (typeNode === undefined) {
    return;
  }

  lines.push(`  readonly ${name}${required ? "" : "?"}: ${typeNode};`);
}

function hasRequiredParameters(parameters: readonly ParameterModel[], location: ParameterModel["location"]): boolean {
  return parameters.some((parameter) => parameter.location === location && parameter.required);
}

function parameterKey(value: string): string {
  const identifier = sanitizeIdentifier(value, "parameter");
  return identifier === value ? value : quoteString(value);
}
