import type { EnvironmentObservation, HazardSeverity } from "./types.js";

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
};

function severityRank(s?: string | null): number {
  return SEVERITY_RANK[s ?? ""] ?? 0;
}

function isSafetyItem(obs: EnvironmentObservation): boolean {
  return (obs.severity === "critical" || obs.severity === "high") && obs.confidence >= 0.5;
}

function shortText(obs: EnvironmentObservation): string {
  const dir = obs.direction ? ` ${obs.direction}` : "";
  const dist = obs.distance != null ? ` in ${Math.round(obs.distance)}m` : "";
  const prefix = obs.confidence < 0.7 ? "Possible " : "";
  return `${prefix}${obs.description}${dir}${dist}`;
}

export function compressSpeech(
  observations: EnvironmentObservation[],
  maxWords = 10
): {
  original: string[];
  compressed: string;
  wordCount: number;
  compressionRatio: number;
  safetyPreserved: boolean;
  droppedItems: string[];
} {
  const originalTexts = observations.map((o) => shortText(o));

  const sorted = [...observations].sort((a, b) => {
    const safetyDiff = (isSafetyItem(b) ? 1 : 0) - (isSafetyItem(a) ? 1 : 0);
    if (safetyDiff !== 0) return safetyDiff;
    const sevDiff = severityRank(b.severity) - severityRank(a.severity);
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });

  const included: EnvironmentObservation[] = [];
  let wordBudget = maxWords;
  let safetyPreserved = true;

  for (const obs of sorted) {
    const text = shortText(obs);
    const words = text.split(/\s+/).length;

    if (isSafetyItem(obs)) {
      included.push(obs);
      wordBudget -= words;
      continue;
    }

    if (wordBudget > 0 && words <= wordBudget) {
      included.push(obs);
      wordBudget -= words;
    }
  }

  const safetyObs = sorted.filter(isSafetyItem);
  for (const s of safetyObs) {
    if (!included.includes(s)) {
      safetyPreserved = false;
    }
  }

  const droppedItems = sorted
    .filter((o) => !included.includes(o))
    .map((o) => shortText(o));

  const compressed = included.map((o) => shortText(o)).join(". ").replace(/\.\s*\./g, ".") + ".";

  const totalOriginalWords = originalTexts.join(" ").split(/\s+/).length;
  const compressedWords = compressed.split(/\s+/).length;
  const compressionRatio = totalOriginalWords > 0 ? totalOriginalWords / compressedWords : 1;

  return {
    original: originalTexts,
    compressed,
    wordCount: compressedWords,
    compressionRatio: Math.round(compressionRatio * 10) / 10,
    safetyPreserved,
    droppedItems,
  };
}
