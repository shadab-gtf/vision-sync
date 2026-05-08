import type { FileDiff } from "../types/safety.js";

const PREVIEW_CONTEXT_LINES = 6;

export function createFileDiff(filePath: string, before: string | undefined, after: string): FileDiff {
  if (before === after) {
    return {
      filePath,
      status: "unchanged",
      additions: 0,
      deletions: 0,
      preview: ""
    };
  }

  const beforeLines = splitLines(before ?? "");
  const afterLines = splitLines(after);
  const prefixLength = commonPrefixLength(beforeLines, afterLines);
  const suffixLength = commonSuffixLength(beforeLines, afterLines, prefixLength);
  const removed = beforeLines.slice(prefixLength, beforeLines.length - suffixLength);
  const added = afterLines.slice(prefixLength, afterLines.length - suffixLength);
  const contextBefore = beforeLines.slice(Math.max(0, prefixLength - PREVIEW_CONTEXT_LINES), prefixLength);
  const contextAfter = afterLines.slice(afterLines.length - suffixLength, Math.min(afterLines.length, afterLines.length - suffixLength + PREVIEW_CONTEXT_LINES));
  const previewLines = [
    ...contextBefore.map((line) => ` ${line}`),
    ...removed.map((line) => `-${line}`),
    ...added.map((line) => `+${line}`),
    ...contextAfter.map((line) => ` ${line}`)
  ];

  return {
    filePath,
    status: before === undefined ? "created" : "modified",
    additions: added.length,
    deletions: removed.length,
    preview: previewLines.join("\n")
  };
}

function splitLines(content: string): readonly string[] {
  if (content.length === 0) {
    return [];
  }

  const normalized = content.split("\r\n").join("\n");
  return normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n") : normalized.split("\n");
}

function commonPrefixLength(left: readonly string[], right: readonly string[]): number {
  const limit = Math.min(left.length, right.length);
  let index = 0;
  while (index < limit && left[index] === right[index]) {
    index += 1;
  }
  return index;
}

function commonSuffixLength(left: readonly string[], right: readonly string[], prefixLength: number): number {
  const limit = Math.min(left.length, right.length) - prefixLength;
  let index = 0;
  while (index < limit && left[left.length - 1 - index] === right[right.length - 1 - index]) {
    index += 1;
  }
  return index;
}
