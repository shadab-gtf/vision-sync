const WORD_SEPARATOR = "-";

export function toPascalCase(value: string): string {
  const words = splitWords(value);
  return words.map(capitalize).join("");
}

export function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.length === 0 ? "operation" : pascal[0]?.toLowerCase() + pascal.slice(1);
}

export function toKebabCase(value: string): string {
  return splitWords(value).map((word) => word.toLowerCase()).join(WORD_SEPARATOR);
}

export function sanitizeIdentifier(value: string, fallback: string): string {
  const words = splitWords(value);
  const candidate = words.length === 0 ? fallback : toCamelCase(words.join(" "));
  const first = candidate[0];
  const prefixed = first !== undefined && isIdentifierStart(first) ? candidate : `_${candidate}`;
  return Array.from(prefixed)
    .map((character, index) => {
      if (index === 0) {
        return isIdentifierStart(character) ? character : "_";
      }

      return isIdentifierPart(character) ? character : "_";
    })
    .join("");
}

export function quoteString(value: string): string {
  return JSON.stringify(value);
}

export function splitWords(value: string): readonly string[] {
  const words: string[] = [];
  let current = "";
  let previousWasLower = false;

  for (const character of value) {
    if (isAlphaNumeric(character)) {
      const isUpper = character >= "A" && character <= "Z";
      if (isUpper && previousWasLower && current.length > 0) {
        words.push(current);
        current = character;
      } else {
        current += character;
      }
      previousWasLower = character >= "a" && character <= "z";
      continue;
    }

    if (current.length > 0) {
      words.push(current);
      current = "";
    }
    previousWasLower = false;
  }

  if (current.length > 0) {
    words.push(current);
  }

  return words;
}

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value[0]?.toUpperCase() + value.slice(1);
}

function isAlphaNumeric(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}

function isIdentifierStart(character: string): boolean {
  return (character >= "a" && character <= "z") || (character >= "A" && character <= "Z") || character === "_" || character === "$";
}

function isIdentifierPart(character: string): boolean {
  return isIdentifierStart(character) || (character >= "0" && character <= "9");
}
