import type { JsonValue } from "./json.js";

export type HttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export interface OpenApiReferenceObject {
  readonly $ref: string;
  readonly description?: string;
  readonly summary?: string;
}

export type OpenApiSchemaReference = OpenApiSchemaObject | OpenApiReferenceObject;

export interface OpenApiSchemaObject {
  readonly $ref?: string;
  readonly type?: string | readonly string[];
  readonly format?: string;
  readonly title?: string;
  readonly description?: string;
  readonly nullable?: boolean;
  readonly required?: readonly string[];
  readonly enum?: readonly JsonValue[];
  readonly const?: JsonValue;
  readonly properties?: Readonly<Record<string, OpenApiSchemaReference>>;
  readonly items?: OpenApiSchemaReference;
  readonly additionalProperties?: boolean | OpenApiSchemaReference;
  readonly allOf?: readonly OpenApiSchemaReference[];
  readonly oneOf?: readonly OpenApiSchemaReference[];
  readonly anyOf?: readonly OpenApiSchemaReference[];
}

export interface OpenApiMediaTypeObject {
  readonly schema?: OpenApiSchemaReference;
}

export interface OpenApiRequestBodyObject {
  readonly description?: string;
  readonly required?: boolean;
  readonly content?: Readonly<Record<string, OpenApiMediaTypeObject>>;
}

export interface OpenApiResponseObject {
  readonly description?: string;
  readonly content?: Readonly<Record<string, OpenApiMediaTypeObject>>;
}

export interface OpenApiParameterObject {
  readonly name: string;
  readonly in: "query" | "header" | "path" | "cookie";
  readonly description?: string;
  readonly required?: boolean;
  readonly schema?: OpenApiSchemaReference;
}

export interface OpenApiOperationObject {
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly parameters?: readonly (OpenApiParameterObject | OpenApiReferenceObject)[];
  readonly requestBody?: OpenApiRequestBodyObject | OpenApiReferenceObject;
  readonly responses?: Readonly<Record<string, OpenApiResponseObject | OpenApiReferenceObject>>;
}

export interface OpenApiPathItemObject {
  readonly parameters?: readonly (OpenApiParameterObject | OpenApiReferenceObject)[];
  readonly get?: OpenApiOperationObject;
  readonly put?: OpenApiOperationObject;
  readonly post?: OpenApiOperationObject;
  readonly delete?: OpenApiOperationObject;
  readonly options?: OpenApiOperationObject;
  readonly head?: OpenApiOperationObject;
  readonly patch?: OpenApiOperationObject;
  readonly trace?: OpenApiOperationObject;
}

export interface OpenApiComponentsObject {
  readonly schemas?: Readonly<Record<string, OpenApiSchemaReference>>;
  readonly parameters?: Readonly<Record<string, OpenApiParameterObject>>;
  readonly requestBodies?: Readonly<Record<string, OpenApiRequestBodyObject>>;
  readonly responses?: Readonly<Record<string, OpenApiResponseObject>>;
}

export interface OpenApiDocument {
  readonly openapi?: string;
  readonly swagger?: string;
  readonly info?: {
    readonly title?: string;
    readonly version?: string;
  };
  readonly paths?: Readonly<Record<string, OpenApiPathItemObject>>;
  readonly components?: OpenApiComponentsObject;
}

export interface ParameterModel {
  readonly name: string;
  readonly location: OpenApiParameterObject["in"];
  readonly required: boolean;
  readonly typeNode: string;
}

export interface OperationModel {
  readonly id: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly tags: readonly string[];
  readonly summary: string | undefined;
  readonly parameters: readonly ParameterModel[];
  readonly requestBodyType: string | undefined;
  readonly requestBodyRequired: boolean;
  readonly responseType: string;
}

export interface SchemaDigest {
  readonly checksum: string;
  readonly title: string | undefined;
  readonly version: string | undefined;
  readonly endpointCount: number;
  readonly entityCount: number;
  readonly operations: readonly OperationModel[];
  readonly entityNames: readonly string[];
}
