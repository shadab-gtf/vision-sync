import ts from "typescript";
import type { VisionConfig } from "../types/config.js";

export interface GeneratedRegion {
  readonly id: string;
  readonly startCommentStart: number;
  readonly startCommentEnd: number;
  readonly endCommentStart: number;
  readonly endCommentEnd: number;
  readonly contentStart: number;
  readonly contentEnd: number;
}

interface OpenRegion {
  readonly id: string;
  readonly startCommentStart: number;
  readonly startCommentEnd: number;
  readonly contentStart: number;
}

export function findGeneratedRegions(sourceText: string, config: VisionConfig): readonly GeneratedRegion[] {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.JSX, sourceText);
  const regions: GeneratedRegion[] = [];
  let active: OpenRegion | undefined;

  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const kind = scanner.getToken();
    if (kind !== ts.SyntaxKind.SingleLineCommentTrivia && kind !== ts.SyntaxKind.MultiLineCommentTrivia) {
      continue;
    }

    const tokenText = scanner.getTokenText();
    const tokenStart = scanner.getTokenPos();
    const tokenEnd = scanner.getTextPos();

    if (tokenText.includes(config.safety.generatedMarkers.start)) {
      active = {
        id: markerId(tokenText, config.safety.generatedMarkers.start),
        startCommentStart: tokenStart,
        startCommentEnd: tokenEnd,
        contentStart: tokenEnd
      };
      continue;
    }

    if (tokenText.includes(config.safety.generatedMarkers.end) && active !== undefined) {
      const endId = markerId(tokenText, config.safety.generatedMarkers.end);
      if (endId === active.id) {
        regions.push({
          ...active,
          endCommentStart: tokenStart,
          endCommentEnd: tokenEnd,
          contentEnd: tokenStart
        });
      }
      active = undefined;
    }
  }

  return regions;
}

function markerId(comment: string, marker: string): string {
  const markerIndex = comment.indexOf(marker);
  if (markerIndex < 0) {
    return "default";
  }

  const suffix = comment.slice(markerIndex + marker.length);
  const withoutTerminators = suffix.split("*").join("").split("/").join("").trim();
  return withoutTerminators.length === 0 ? "default" : withoutTerminators;
}
