import type { AudioMessage, AudioConfig, LogEntry, ResearchDebtEntry } from "./types.js";

export interface CognitiveLoadWindow {
  messages: Array<{ timestamp: number; wordCount: number; type: string }>;
  suppressedCount: number;
  windowSeconds: number;
}

export interface EngineState {
  config: AudioConfig;
  queue: AudioMessage[];
  log: LogEntry[];
  researchDebt: ResearchDebtEntry[];
  cognitiveLoad: CognitiveLoadWindow;
}

export const state: EngineState = {
  config: {
    verbosityMode: "normal",
    personalityStyle: "standard",
    speechRate: 1.0,
    confidenceThreshold: 0.5,
    maxMessagesPerMinute: 15,
    enabled: true,
    suppressLowConfidence: false,
  },
  queue: [],
  log: [],
  researchDebt: [],
  cognitiveLoad: {
    messages: [],
    suppressedCount: 0,
    windowSeconds: 60,
  },
};
