import { randomUUID } from "crypto";
import type { AudioMessage, HazardInput, VerbosityMode, Interruptibility } from "./types.js";
import { state } from "./state.js";
import { logEvent } from "./observatory.js";

const HAZARD_LABELS: Record<string, string> = {
  obstacle: "obstacle",
  "drop-off": "drop-off",
  "stairs-down": "stairs going down",
  "stairs-up": "stairs going up",
  door: "doorway",
  "narrow-passage": "narrow passage",
  "surface-change": "surface change",
  unknown: "unknown hazard",
};

const DIRECTION_LABELS: Record<string, string> = {
  ahead: "ahead",
  left: "on your left",
  right: "on your right",
  "slightly-left": "slightly left",
  "slightly-right": "slightly right",
  behind: "behind you",
};

function buildHazardText(input: HazardInput, verbosity: VerbosityMode): string {
  const hazardLabel = HAZARD_LABELS[input.hazardType] ?? "hazard";
  const dirLabel = DIRECTION_LABELS[input.direction] ?? input.direction;
  const confidencePrefix = input.confidence < 0.7 ? "Possible " : input.confidence < 0.5 ? "Uncertain " : "";

  if (verbosity === "short") {
    const distShort = input.distance < 1 ? "" : ` in ${Math.round(input.distance)}m`;
    return `${confidencePrefix}${capitalize(hazardLabel)} ${dirLabel}${distShort}.`;
  }

  const distText = formatDistance(input.distance);

  if (verbosity === "verbose" || verbosity === "expert") {
    const confPct = Math.round(input.confidence * 100);
    const urgencyNote = input.urgency === "immediate" ? " Stop immediately." : input.urgency === "high" ? " Slow down." : "";
    const devNote = verbosity === "expert" ? ` [conf:${confPct}%, sev:${input.severity}]` : "";
    return `${confidencePrefix}${capitalize(hazardLabel)} detected ${dirLabel}${distText}.${urgencyNote}${devNote}`;
  }

  const urgencyNote =
    input.urgency === "immediate" ? " Stop immediately." :
    input.urgency === "high" ? " Use caution." :
    "";

  return `${confidencePrefix}${capitalize(hazardLabel)} ${dirLabel}${distText}.${urgencyNote}`;
}

function formatDistance(meters: number): string {
  if (meters < 0.3) return " immediately";
  if (meters < 0.75) return " very close";
  if (meters < 1.5) return ` in ${Math.round(meters * 10) / 10} meter`;
  return ` in ${Math.round(meters)} meters`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function computeHazardPriority(input: HazardInput): number {
  const severityBase: Record<string, number> = { critical: 85, high: 70, moderate: 50, low: 30 };
  const urgencyBonus: Record<string, number> = { immediate: 15, high: 10, moderate: 5, low: 0 };
  const distancePenalty = Math.min(20, input.distance * 2);

  let score = (severityBase[input.severity] ?? 30) + (urgencyBonus[input.urgency] ?? 0) + input.confidence * 10 - distancePenalty;
  return Math.max(10, Math.min(100, Math.round(score)));
}

function computeInterruptibility(input: HazardInput): Interruptibility {
  if (input.severity === "critical" || input.urgency === "immediate") return "critical";
  if (input.severity === "high" || input.urgency === "high") return "urgent";
  if (input.severity === "moderate") return "important";
  return "non-interruptible";
}

function buildReasoning(input: HazardInput, priority: number): string {
  return [
    `Hazard type '${input.hazardType}' with severity '${input.severity}'.`,
    `Direction: ${input.direction}, distance: ${input.distance.toFixed(1)}m.`,
    `Urgency: ${input.urgency}, confidence: ${Math.round(input.confidence * 100)}%.`,
    `Priority score: ${priority}.`,
    input.confidence < 0.7 ? `Uncertainty language applied (confidence below 70%).` : null,
  ].filter(Boolean).join(" ");
}

function computeTtl(input: HazardInput): string | null {
  if (input.severity === "critical" || input.urgency === "immediate") return null;
  const ttlMs = {
    high: 10000,
    moderate: 20000,
    low: 30000,
  }[input.urgency as string] ?? 15000;
  return new Date(Date.now() + ttlMs).toISOString();
}

export function generateHazardMessage(input: HazardInput): AudioMessage {
  const verbosity = state.config.verbosityMode;
  const text = buildHazardText(input, verbosity);
  const priority = computeHazardPriority(input);
  const interruptibility = computeInterruptibility(input);

  const msg: AudioMessage = {
    id: randomUUID(),
    text,
    type: "hazard",
    priority,
    confidence: input.confidence,
    verbosityLevel: verbosity,
    interruptibility,
    reasoning: buildReasoning(input, priority),
    expiresAt: computeTtl(input),
    createdAt: new Date().toISOString(),
    metadata: {
      hazardType: input.hazardType,
      severity: input.severity,
      distance: input.distance,
      direction: input.direction,
      urgency: input.urgency,
    },
  };

  logEvent("spoken", text, { priority, confidence: input.confidence, metadata: { hazardType: input.hazardType } });

  return msg;
}
