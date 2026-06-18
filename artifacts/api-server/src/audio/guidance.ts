import { randomUUID } from "crypto";
import type { AudioMessage, GuidanceInput, GuidanceDirection, VerbosityMode, Interruptibility } from "./types.js";
import { state } from "./state.js";
import { logEvent } from "./observatory.js";

const DIRECTION_PHRASES: Record<GuidanceDirection, Record<string, string>> = {
  forward: {
    low: "Continue forward.",
    moderate: "Move forward.",
    high: "Go forward now.",
    immediate: "Move forward immediately.",
  },
  left: {
    low: "Move slightly left.",
    moderate: "Turn left.",
    high: "Move left.",
    immediate: "Move left immediately.",
  },
  right: {
    low: "Move slightly right.",
    moderate: "Turn right.",
    high: "Move right.",
    immediate: "Move right immediately.",
  },
  stop: {
    low: "Slow down.",
    moderate: "Stop when safe.",
    high: "Stop.",
    immediate: "Stop immediately.",
  },
  "slow-down": {
    low: "Reduce pace slightly.",
    moderate: "Slow down.",
    high: "Slow down now.",
    immediate: "Slow down immediately.",
  },
  reassess: {
    low: "Pause and reassess your surroundings.",
    moderate: "Stop and reassess.",
    high: "Stop. Reassess environment.",
    immediate: "Stop immediately. Reassess.",
  },
  back: {
    low: "Consider stepping back.",
    moderate: "Step back.",
    high: "Step back now.",
    immediate: "Step back immediately.",
  },
};

function buildGuidanceText(input: GuidanceInput, verbosity: VerbosityMode): string {
  const phrases = DIRECTION_PHRASES[input.direction];
  const base = phrases[input.urgency] ?? phrases["moderate"];

  if (verbosity === "short") {
    return base;
  }

  let text = base;

  if (input.distanceMeters != null) {
    const dist = input.distanceMeters < 1
      ? "very close"
      : `${Math.round(input.distanceMeters)} meters`;
    text = text.replace(".", ` — ${dist}.`);
  }

  if (input.context && (verbosity === "verbose" || verbosity === "expert")) {
    text = `${text} ${input.context}`;
  }

  return text;
}

function computeGuidancePriority(input: GuidanceInput): number {
  const urgencyBase: Record<string, number> = { immediate: 85, high: 65, moderate: 45, low: 25 };
  const directionBonus: Record<string, number> = {
    stop: 10,
    back: 8,
    reassess: 5,
    "slow-down": 3,
    forward: 0,
    left: 0,
    right: 0,
  };
  return Math.min(100, (urgencyBase[input.urgency] ?? 45) + (directionBonus[input.direction] ?? 0));
}

function computeGuidanceInterruptibility(input: GuidanceInput): Interruptibility {
  if (input.direction === "stop" && input.urgency === "immediate") return "critical";
  if (input.direction === "back" && (input.urgency === "immediate" || input.urgency === "high")) return "critical";
  if (input.urgency === "immediate") return "urgent";
  if (input.urgency === "high") return "urgent";
  if (input.urgency === "moderate") return "important";
  return "non-interruptible";
}

function buildReasoning(input: GuidanceInput, priority: number): string {
  return [
    `Guidance direction: '${input.direction}' with urgency '${input.urgency}'.`,
    input.distanceMeters != null ? `Distance context: ${input.distanceMeters.toFixed(1)}m.` : null,
    input.context ? `Additional context: "${input.context}".` : null,
    `Priority score: ${priority}.`,
  ].filter(Boolean).join(" ");
}

export function generateGuidanceMessage(input: GuidanceInput): AudioMessage {
  const verbosity = state.config.verbosityMode;
  const text = buildGuidanceText(input, verbosity);
  const priority = computeGuidancePriority(input);
  const interruptibility = computeGuidanceInterruptibility(input);

  const msg: AudioMessage = {
    id: randomUUID(),
    text,
    type: "guidance",
    priority,
    confidence: 1.0,
    verbosityLevel: verbosity,
    interruptibility,
    reasoning: buildReasoning(input, priority),
    expiresAt: input.urgency === "low" ? new Date(Date.now() + 30000).toISOString() : null,
    createdAt: new Date().toISOString(),
    metadata: { direction: input.direction, urgency: input.urgency },
  };

  logEvent("spoken", text, { priority, confidence: 1.0, metadata: { direction: input.direction } });

  return msg;
}
