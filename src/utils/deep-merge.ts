import { isRecord } from "../types/json.js";
import type { DeepPartial } from "../types/utility.js";

export function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined) {
    return cloneValue(base) as T;
  }

  const output: Record<string, unknown> = isRecord(base) ? cloneRecord(base) : {};
  const overrideRecord = override as Record<string, unknown>;

  for (const [key, value] of Object.entries(overrideRecord)) {
    if (value === undefined) {
      continue;
    }

    const existing = output[key];
    if (isRecord(existing) && isRecord(value) && !Array.isArray(existing) && !Array.isArray(value)) {
      output[key] = deepMerge(existing, value as DeepPartial<Record<string, unknown>>);
      continue;
    }

    output[key] = Array.isArray(value) ? [...value] : value;
  }

  return output as T;
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (isRecord(value)) {
    return cloneRecord(value);
  }

  return value;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    output[key] = cloneValue(entry);
  }

  return output;
}
