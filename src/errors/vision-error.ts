export type VisionErrorCode =
  | "CONFIG_NOT_FOUND"
  | "CONFIG_INVALID"
  | "SCHEMA_NOT_FOUND"
  | "SCHEMA_INVALID"
  | "UNSAFE_WRITE"
  | "TRANSFORM_REJECTED"
  | "ROLLBACK_FAILED"
  | "VALIDATION_FAILED";

export interface VisionErrorDetails {
  readonly reason: string;
  readonly suggestion: string;
  readonly filePath?: string;
}

export class VisionError extends Error {
  public readonly code: VisionErrorCode;
  public readonly details: VisionErrorDetails;

  public constructor(code: VisionErrorCode, message: string, details: VisionErrorDetails) {
    super(message);
    this.name = "VisionError";
    this.code = code;
    this.details = details;
  }
}
