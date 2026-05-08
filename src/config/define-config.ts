import { DEFAULT_CONFIG } from "./defaults.js";
import { deepMerge } from "../utils/deep-merge.js";
import type { ConfigInput, VisionConfig } from "../types/config.js";

export function defineConfig(config: ConfigInput): VisionConfig {
  return deepMerge<VisionConfig>(DEFAULT_CONFIG, config);
}
