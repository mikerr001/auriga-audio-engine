import type { AudioConfig } from "./types.js";
import { state } from "./state.js";
import { logEvent } from "./observatory.js";

export function getConfig(): AudioConfig {
  return { ...state.config };
}

export function updateConfig(updates: Partial<AudioConfig>): AudioConfig {
  const prev = { ...state.config };
  state.config = { ...state.config, ...updates };

  logEvent("system", `Configuration updated`, {
    metadata: {
      changes: Object.keys(updates).reduce<Record<string, unknown>>((acc, k) => {
        const key = k as keyof AudioConfig;
        acc[key] = { from: prev[key], to: state.config[key] };
        return acc;
      }, {}),
    },
  });

  return { ...state.config };
}
