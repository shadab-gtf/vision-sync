import { sha256 } from "../utils/checksum.js";
import { stableStringify } from "../utils/stable-stringify.js";
import type { OperationModel, SchemaDigest } from "../types/openapi.js";

export interface OperationDiff {
  readonly added: readonly OperationModel[];
  readonly removed: readonly OperationModel[];
  readonly changed: readonly OperationModel[];
  readonly unchanged: readonly OperationModel[];
}

export function diffSchemaDigests(previous: SchemaDigest | undefined, next: SchemaDigest): OperationDiff {
  if (previous === undefined) {
    return {
      added: next.operations,
      removed: [],
      changed: [],
      unchanged: []
    };
  }

  const previousById = new Map(previous.operations.map((operation) => [operation.id, operation]));
  const nextById = new Map(next.operations.map((operation) => [operation.id, operation]));
  const added: OperationModel[] = [];
  const removed: OperationModel[] = [];
  const changed: OperationModel[] = [];
  const unchanged: OperationModel[] = [];

  for (const operation of next.operations) {
    const previousOperation = previousById.get(operation.id);
    if (previousOperation === undefined) {
      added.push(operation);
      continue;
    }

    if (operationChecksum(previousOperation) === operationChecksum(operation)) {
      unchanged.push(operation);
    } else {
      changed.push(operation);
    }
  }

  for (const operation of previous.operations) {
    if (!nextById.has(operation.id)) {
      removed.push(operation);
    }
  }

  return { added, removed, changed, unchanged };
}

export function operationChecksum(operation: OperationModel): string {
  return sha256(stableStringify(operation));
}
