export interface NamedImportRequest {
  readonly name: string;
  readonly alias?: string;
}

export type AstOperation =
  | {
      readonly kind: "ensure-import";
      readonly moduleSpecifier: string;
      readonly namedImports: readonly NamedImportRequest[];
    }
  | {
      readonly kind: "replace-generated-region";
      readonly regionId: string;
      readonly content: string;
    }
  | {
      readonly kind: "create-generated-region";
      readonly componentName: string;
      readonly regionId: string;
      readonly content: string;
      readonly position: "function-start" | "function-end";
    };

export interface AstTransformationPlan {
  readonly filePath: string;
  readonly operations: readonly AstOperation[];
}

export interface AstDiagnostic {
  readonly message: string;
  readonly line: number | undefined;
  readonly column: number | undefined;
}

export interface AstTransformationResult {
  readonly filePath: string;
  readonly changed: boolean;
  readonly source: string;
  readonly diagnostics: readonly AstDiagnostic[];
}
