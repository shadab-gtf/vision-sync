import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function fileSha256(filePath: string): Promise<string | undefined> {
  try {
    return sha256(await readFile(filePath));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
