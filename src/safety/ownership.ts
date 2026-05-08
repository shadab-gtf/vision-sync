import path from "node:path";
import { isVisionGenerated } from "../generator/generated-file.js";
import { isInsideDirectory, normalizeRelativePath, resolveInside } from "../utils/path.js";
import type { VisionConfig } from "../types/config.js";

export interface OwnershipCheck {
  readonly allowed: boolean;
  readonly reason: string | undefined;
  readonly suggestion: string | undefined;
}

export function checkWriteOwnership(
  rootDir: string,
  config: VisionConfig,
  filePath: string,
  existingContent: string | undefined,
  ownership: "generated" | "tooling" | "developer-approved"
): OwnershipCheck {
  if (!isInsideDirectory(rootDir, filePath)) {
    return denied(
      "The target file is outside the configured project root.",
      "Move the output directory inside the project or choose a workspace-local path."
    );
  }

  if (ownership === "tooling") {
    return allowed();
  }

  if (isProtectedPath(rootDir, config, filePath) && !isInsideGeneratedBoundary(rootDir, config, filePath)) {
    return denied(
      "The target file is inside a protected folder.",
      "Use preview mode, choose an output directory under a generated boundary, or update protectedFolders intentionally."
    );
  }

  if (ownership === "developer-approved") {
    return allowed();
  }

  if (existingContent !== undefined && !isVisionGenerated(existingContent, config)) {
    return denied(
      "The file already exists and is not marked as vision-generated.",
      "Move developer-owned code elsewhere or choose a clean generated output directory."
    );
  }

  return allowed();
}

export function isInsideGeneratedBoundary(rootDir: string, config: VisionConfig, filePath: string): boolean {
  const absoluteBoundaries = [
    resolveInside(rootDir, config.output.baseDir),
    ...config.integration.integrationBoundaries.map((boundary) => resolveInside(rootDir, boundary))
  ];

  return absoluteBoundaries.some((boundary) => isInsideDirectory(boundary, filePath));
}

function isProtectedPath(rootDir: string, config: VisionConfig, filePath: string): boolean {
  const relativePath = normalizeRelativePath(path.relative(rootDir, filePath));
  return config.safety.protectedFolders.some((folder) => {
    const normalizedFolder = normalizeRelativePath(folder);
    return relativePath === normalizedFolder || relativePath.startsWith(`${normalizedFolder}/`);
  });
}

function allowed(): OwnershipCheck {
  return {
    allowed: true,
    reason: undefined,
    suggestion: undefined
  };
}

function denied(reason: string, suggestion: string): OwnershipCheck {
  return {
    allowed: false,
    reason,
    suggestion
  };
}
