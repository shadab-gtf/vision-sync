import path from "node:path";

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

export function normalizeRelativePath(filePath: string): string {
  const normalized = toPosixPath(path.normalize(filePath));
  return normalized.startsWith("./") ? normalized.slice(2) : normalized;
}

export function resolveInside(rootDir: string, filePath: string): string {
  return path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(rootDir, filePath);
}

export function isInsideDirectory(rootDir: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(rootDir), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function encodePathSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function decodePathSegment(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}
