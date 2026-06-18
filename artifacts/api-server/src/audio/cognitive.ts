import type { AudioMessage, OverloadRisk } from "./types.js";
import { state } from "./state.js";
import { logEvent } from "./observatory.js";

const WORDS_PER_SECOND = 2.5;

function pruneWindow(): void {
  const cutoff = Date.now() - state.cognitiveLoad.windowSeconds * 1000;
  state.cognitiveLoad.messages = state.cognitiveLoad.messages.filter(
    (m) => m.timestamp > cutoff
  );
}

export function recordSpokenMessage(msg: AudioMessage): void {
  pruneWindow();
  const wordCount = msg.text.split(/\s+/).length;
  state.cognitiveLoad.messages.push({
    timestamp: Date.now(),
    wordCount,
    type: msg.type,
  });
}

export function recordSuppressed(): void {
  state.cognitiveLoad.suppressedCount++;
}

export function resetCognitiveLoad(): void {
  state.cognitiveLoad.messages = [];
  state.cognitiveLoad.suppressedCount = 0;
  logEvent("system", "Cognitive load tracker reset");
}

export function getCognitiveLoadMetrics(recentMessages: AudioMessage[]): {
  messageFrequency: number;
  messageDensity: number;
  overloadRisk: OverloadRisk;
  recentMessages: AudioMessage[];
  userBurden: number;
  suppressedCount: number;
  windowSeconds: number;
} {
  pruneWindow();

  const windowMs = state.cognitiveLoad.windowSeconds * 1000;
  const windowMinutes = windowMs / 60000;
  const msgCount = state.cognitiveLoad.messages.length;
  const messageFrequency = msgCount / windowMinutes;

  const totalWords = state.cognitiveLoad.messages.reduce((s, m) => s + m.wordCount, 0);
  const totalSpeechSeconds = totalWords / WORDS_PER_SECOND;
  const messageDensity = totalWords / windowMinutes;

  const maxMsgsPerMin = state.config.maxMessagesPerMinute;
  const loadRatio = messageFrequency / maxMsgsPerMin;

  let overloadRisk: OverloadRisk;
  let userBurden: number;

  if (loadRatio >= 1.5 || totalSpeechSeconds > windowMs * 0.5 / 1000) {
    overloadRisk = "critical";
    userBurden = Math.min(1, 0.9 + loadRatio * 0.05);
  } else if (loadRatio >= 1.0) {
    overloadRisk = "high";
    userBurden = Math.min(0.9, 0.7 + loadRatio * 0.1);
  } else if (loadRatio >= 0.7) {
    overloadRisk = "moderate";
    userBurden = 0.4 + loadRatio * 0.3;
  } else if (loadRatio >= 0.4) {
    overloadRisk = "low";
    userBurden = 0.1 + loadRatio * 0.3;
  } else {
    overloadRisk = "none";
    userBurden = loadRatio * 0.25;
  }

  if (overloadRisk === "critical" || overloadRisk === "high") {
    logEvent("overload", `Cognitive overload detected: ${messageFrequency.toFixed(1)} msgs/min (limit: ${maxMsgsPerMin})`, {
      metadata: { messageFrequency, messageDensity, userBurden, overloadRisk },
    });
  }

  return {
    messageFrequency: Math.round(messageFrequency * 10) / 10,
    messageDensity: Math.round(messageDensity * 10) / 10,
    overloadRisk,
    recentMessages: recentMessages.slice(0, 10),
    userBurden: Math.round(userBurden * 100) / 100,
    suppressedCount: state.cognitiveLoad.suppressedCount,
    windowSeconds: state.cognitiveLoad.windowSeconds,
  };
}

export function isOverloaded(): boolean {
  pruneWindow();
  const windowMinutes = state.cognitiveLoad.windowSeconds / 60;
  const freq = state.cognitiveLoad.messages.length / windowMinutes;
  return freq >= state.config.maxMessagesPerMinute;
}
