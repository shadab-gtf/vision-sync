import path from "node:path";
import { IndentationText, NewLineKind, Project, Node, QuoteKind, type Block, type SourceFile } from "ts-morph";
import ts from "typescript";
import { VisionError } from "../errors/vision-error.js";
import { readTextIfExists } from "../utils/fs.js";
import { isInsideDirectory } from "../utils/path.js";
import { findGeneratedRegions } from "./generated-regions.js";
import type { VisionConfig } from "../types/config.js";
import type {
  AstDiagnostic,
  AstOperation,
  AstTransformationPlan,
  AstTransformationResult,
  NamedImportRequest
} from "../types/ast.js";

export class AstTransformationEngine {
  private readonly rootDir: string;
  private readonly config: VisionConfig;
  private readonly project: Project;

  public constructor(rootDir: string, config: VisionConfig, tsConfigFilePath?: string) {
    this.rootDir = path.resolve(rootDir);
    this.config = config;
    const projectOptions = tsConfigFilePath === undefined ? {
      skipAddingFilesFromTsConfig: true,
      manipulationSettings: {
        indentationText: config.formatting.indent === "\t" ? IndentationText.Tab : IndentationText.TwoSpaces,
        newLineKind: config.formatting.lineEnding === "\r\n" ? NewLineKind.CarriageReturnLineFeed : NewLineKind.LineFeed,
        quoteKind: QuoteKind.Double
      }
    } : {
      tsConfigFilePath,
      skipAddingFilesFromTsConfig: tsConfigFilePath === undefined,
      manipulationSettings: {
        indentationText: config.formatting.indent === "\t" ? IndentationText.Tab : IndentationText.TwoSpaces,
        newLineKind: config.formatting.lineEnding === "\r\n" ? NewLineKind.CarriageReturnLineFeed : NewLineKind.LineFeed,
        quoteKind: QuoteKind.Double
      }
    };
    this.project = new Project(projectOptions);
  }

  public async transform(plan: AstTransformationPlan): Promise<AstTransformationResult> {
    const filePath = path.resolve(plan.filePath);
    this.assertInsideRoot(filePath);
    this.assertAstEnabled();

    const originalSource = await readTextIfExists(filePath);
    if (originalSource === undefined) {
      throw new VisionError("TRANSFORM_REJECTED", "AST transform target does not exist.", {
        reason: "The target file could not be found.",
        suggestion: "Run in preview mode and verify the integration target path.",
        filePath
      });
    }

    const sourceFile = this.project.createSourceFile(filePath, originalSource, { overwrite: true });
    for (const operation of plan.operations) {
      this.assertPermission(operation);
      this.applyOperation(sourceFile, operation);
      this.assertValidSource(sourceFile, filePath);
    }

    const transformedSource = sourceFile.getFullText();
    return {
      filePath,
      changed: transformedSource !== originalSource,
      source: transformedSource,
      diagnostics: []
    };
  }

  private applyOperation(sourceFile: SourceFile, operation: AstOperation): void {
    switch (operation.kind) {
      case "ensure-import":
        this.ensureImport(sourceFile, operation.moduleSpecifier, operation.namedImports);
        return;
      case "replace-generated-region":
        this.replaceGeneratedRegion(sourceFile, operation.regionId, operation.content);
        return;
      case "create-generated-region":
        this.createGeneratedRegion(sourceFile, operation.componentName, operation.regionId, operation.content, operation.position);
        return;
    }
  }

  private ensureImport(
    sourceFile: SourceFile,
    moduleSpecifier: string,
    namedImports: readonly NamedImportRequest[]
  ): void {
    const existingImport = sourceFile.getImportDeclarations().find((declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier);
    const localNames = new Set<string>();

    for (const request of namedImports) {
      const localName = request.alias ?? request.name;
      if (this.hasConflictingTopLevelBinding(sourceFile, localName, moduleSpecifier)) {
        throw new VisionError("TRANSFORM_REJECTED", "Import injection was rejected.", {
          reason: `A conflicting top-level binding named "${localName}" already exists.`,
          suggestion: "Use alias mode or choose a different generated import name.",
          filePath: sourceFile.getFilePath()
        });
      }
      localNames.add(localName);
    }

    if (existingImport === undefined) {
      sourceFile.addImportDeclaration({
        moduleSpecifier,
        namedImports: namedImports.map((request) => request.alias === undefined ? request.name : { name: request.name, alias: request.alias })
      });
      return;
    }

    const existingLocalNames = new Set(
      existingImport.getNamedImports().map((namedImport) => namedImport.getAliasNode()?.getText() ?? namedImport.getName())
    );
    for (const request of namedImports) {
      const localName = request.alias ?? request.name;
      if (existingLocalNames.has(localName)) {
        continue;
      }

      existingImport.addNamedImport(request.alias === undefined ? request.name : { name: request.name, alias: request.alias });
    }

    if (localNames.size > 0) {
      existingImport.getNamedImports().sort((left, right) => {
        const leftName = left.getAliasNode()?.getText() ?? left.getName();
        const rightName = right.getAliasNode()?.getText() ?? right.getName();
        return leftName.localeCompare(rightName);
      });
    }
  }

  private replaceGeneratedRegion(sourceFile: SourceFile, regionId: string, content: string): void {
    const sourceText = sourceFile.getFullText();
    const region = findGeneratedRegions(sourceText, this.config).find((entry) => entry.id === regionId);
    if (region === undefined) {
      throw new VisionError("TRANSFORM_REJECTED", "Generated region was not found.", {
        reason: `No generated region named "${regionId}" exists in the target file.`,
        suggestion: "Create an approved generated region first or run preview mode.",
        filePath: sourceFile.getFilePath()
      });
    }

    sourceFile.replaceText([region.contentStart, region.contentEnd], `${this.config.formatting.lineEnding}${content}${this.config.formatting.lineEnding}`);
  }

  private createGeneratedRegion(
    sourceFile: SourceFile,
    componentName: string,
    regionId: string,
    content: string,
    position: "function-start" | "function-end"
  ): void {
    const body = this.findComponentBody(sourceFile, componentName);
    if (body === undefined) {
      throw new VisionError("TRANSFORM_REJECTED", "Generated region could not be created.", {
        reason: `No function or arrow-function component named "${componentName}" was found.`,
        suggestion: "Choose an explicit component target or create the generated region manually.",
        filePath: sourceFile.getFilePath()
      });
    }

    const statements = [
      `// ${this.config.safety.generatedMarkers.start} ${regionId}`,
      content,
      `// ${this.config.safety.generatedMarkers.end} ${regionId}`
    ];

    if (position === "function-start") {
      body.insertStatements(0, statements);
    } else {
      body.addStatements(statements);
    }
  }

  private findComponentBody(sourceFile: SourceFile, componentName: string): Block | undefined {
    for (const declaration of sourceFile.getFunctions()) {
      if (declaration.getName() === componentName || (componentName === "default" && declaration.isDefaultExport())) {
        const body = declaration.getBody();
        return body !== undefined && Node.isBlock(body) ? body : undefined;
      }
    }

    for (const statement of sourceFile.getVariableStatements()) {
      for (const declaration of statement.getDeclarations()) {
        if (declaration.getName() !== componentName) {
          continue;
        }

        const initializer = declaration.getInitializer();
        if (initializer !== undefined && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
          const body = initializer.getBody();
          return Node.isBlock(body) ? body : undefined;
        }
      }
    }

    return undefined;
  }

  private hasConflictingTopLevelBinding(sourceFile: SourceFile, localName: string, moduleSpecifier: string): boolean {
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      for (const namedImport of importDeclaration.getNamedImports()) {
        const importedLocalName = namedImport.getAliasNode()?.getText() ?? namedImport.getName();
        if (importedLocalName === localName && importDeclaration.getModuleSpecifierValue() !== moduleSpecifier) {
          return true;
        }
      }
    }

    for (const statement of sourceFile.getStatements()) {
      if (Node.isImportDeclaration(statement)) {
        continue;
      }
      if (Node.isFunctionDeclaration(statement) && statement.getName() === localName) {
        return true;
      }
      if (Node.isClassDeclaration(statement) && statement.getName() === localName) {
        return true;
      }
      if (Node.isInterfaceDeclaration(statement) && statement.getName() === localName) {
        return true;
      }
      if (Node.isTypeAliasDeclaration(statement) && statement.getName() === localName) {
        return true;
      }
      if (Node.isEnumDeclaration(statement) && statement.getName() === localName) {
        return true;
      }
      if (Node.isVariableStatement(statement)) {
        for (const declaration of statement.getDeclarations()) {
          if (declaration.getName() === localName) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private assertAstEnabled(): void {
    if (!this.config.integration.astEnabled) {
      throw new VisionError("TRANSFORM_REJECTED", "AST transformations are disabled.", {
        reason: "integration.astEnabled is false.",
        suggestion: "Enable AST transformations explicitly or use generated modules/hooks only."
      });
    }
  }

  private assertPermission(operation: AstOperation): void {
    const requiredPermission = operation.kind === "ensure-import" ? "ensure-import" : operation.kind;
    if (!this.config.integration.transformationPermissions.includes(requiredPermission)) {
      throw new VisionError("TRANSFORM_REJECTED", "AST transformation permission is missing.", {
        reason: `The operation "${operation.kind}" is not enabled in transformationPermissions.`,
        suggestion: "Add the permission intentionally after reviewing the preview diff."
      });
    }
  }

  private assertInsideRoot(filePath: string): void {
    if (!isInsideDirectory(this.rootDir, filePath)) {
      throw new VisionError("TRANSFORM_REJECTED", "AST transform target is outside the project root.", {
        reason: "The target file is outside rootDir.",
        suggestion: "Choose a project-local file."
      });
    }
  }

  private assertValidSource(sourceFile: SourceFile, filePath: string): void {
    const source = sourceFile.getFullText();
    const parsed = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const transpiled = ts.transpileModule(source, {
      fileName: filePath,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022
      }
    });
    const parseDiagnostics = (transpiled.diagnostics ?? []).map((diagnostic) => diagnosticToMessage(diagnostic.file ?? parsed, diagnostic));
    if (parseDiagnostics.length > 0) {
      throw new VisionError("VALIDATION_FAILED", "AST transformation produced invalid TypeScript syntax.", {
        reason: parseDiagnostics[0]?.message ?? "The transformed file has syntax diagnostics.",
        suggestion: "No files were written. Review the preview and adjust the generated region target.",
        filePath
      });
    }

    const diagnostics = sourceFile.getPreEmitDiagnostics().map((diagnostic) => diagnostic.getMessageText().toString());
    if (diagnostics.length > 0) {
      throw new VisionError("VALIDATION_FAILED", "AST transformation failed compiler validation.", {
        reason: diagnostics[0] ?? "The transformed file has TypeScript diagnostics.",
        suggestion: "No files were written. Resolve the conflict or run with preview mode.",
        filePath
      });
    }
  }
}

function diagnosticToMessage(sourceFile: ts.SourceFile, diagnostic: ts.Diagnostic): AstDiagnostic {
  const position = diagnostic.start === undefined ? undefined : sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
  return {
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    line: position === undefined ? undefined : position.line + 1,
    column: position === undefined ? undefined : position.character + 1
  };
}
