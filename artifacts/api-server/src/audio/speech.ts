import { randomUUID } from "crypto";
import type {
  AudioMessage,
  EnvironmentObservation,
  EnvironmentContext,
  VerbosityMode,
  PersonalityStyle,
  Interruptibility,
  MessageType,
  HazardSeverity,
} from "./types.js";
import { state } from "./state.js";

function confidencePrefix(confidence: number, verbosity: VerbosityMode): string {
  if (confidence >= 0.9) return "";
  if (confidence >= 0.7) {
    return verbosity === "short" ? "Possible " : "Possible ";
  }
  if (confidence >= 0.5) {
    return verbosity === "short" ? "Possible " : "Uncertain ";
  }
  return verbosity === "short" ? "Possible " : "Low confidence: ";
}

function distanceLabel(meters: number | null | undefined): string {
  if (meters == null) return "";
  if (meters < 0.5) return " immediately";
  if (meters < 1) return " very close";
  if (meters < 2) return ` in ${Math.round(meters * 10) / 10} meter`;
  return ` in ${Math.round(meters)} meters`;
}

function buildObservationText(
  obs: EnvironmentObservation,
  verbosity: VerbosityMode,
  style: PersonalityStyle
): string {
  const prefix = confidencePrefix(obs.confidence, verbosity);
  const dist = distanceLabel(obs.distance);
  const dir = obs.direction ? ` ${obs.direction}` : "";

  if (verbosity === "short") {
    return `${prefix}${obs.description}${dist}.`;
  }

  if (verbosity === "verbose" || verbosity === "expert") {
    const confPct = Math.round(obs.confidence * 100);
    const confNote = style === "research" || style === "developer"
      ? ` [conf: ${confPct}%]`
      : "";
    return `${prefix}${obs.description}${dir}${dist}${confNote}.`;
  }

  return `${prefix}${obs.description}${dir}${dist}.`;
}

function computePriority(
  obs: EnvironmentObservation,
  context: EnvironmentContext | undefined
): number {
  let score = 0;

  const severityScores: Record<string, number> = {
    critical: 90,
    high: 70,
    moderate: 45,
    low: 20,
  };
  score += obs.severity ? (severityScores[obs.severity] ?? 10) : 10;

  score += obs.confidence * 20;

  const complexityBonus: Record<string, number> = {
    chaotic: 10,
    complex: 5,
    moderate: 2,
    simple: 0,
  };
  if (context) {
    score += complexityBonus[context.environmentComplexity] ?? 0;
  }

  return Math.min(100, Math.round(score));
}

function severityToInterruptibility(severity: HazardSeverity | null | undefined): Interruptibility {
  if (!severity) return "important";
  if (severity === "critical") return "critical";
  if (severity === "high") return "urgent";
  if (severity === "moderate") return "important";
  return "non-interruptible";
}

function effectiveVerbosity(
  cfg: VerbosityMode,
  context: EnvironmentContext | undefined
): VerbosityMode {
  if (context?.userPreference) return context.userPreference;
  if (context?.environmentComplexity === "chaotic") {
    if (cfg === "verbose") return "normal";
    if (cfg === "normal") return "short";
  }
  return cfg;
}

export function synthesizeSpeech(
  observations: EnvironmentObservation[],
  context?: EnvironmentContext
): AudioMessage {
  const cfg = state.config;
  const verbosity = effectiveVerbosity(cfg.verbosityMode, context);
  const style = cfg.personalityStyle;

  const sorted = [...observations].sort((a, b) => {
    const sev: Record<string, number> = { critical: 4, high: 3, moderate: 2, low: 1 };
    const aSev = sev[a.severity ?? "low"] ?? 0;
    const bSev = sev[b.severity ?? "low"] ?? 0;
    if (bSev !== aSev) return bSev - aSev;
    return b.confidence - a.confidence;
  });

  const parts = sorted.map((obs) => buildObservationText(obs, verbosity, style));
  const text = parts.join(" ");

  const topObs = sorted[0];
  const priority = computePriority(topObs, context);
  const interruptibility = severityToInterruptibility(topObs?.severity);
  const confidence = sorted.reduce((s, o) => s + o.confidence, 0) / sorted.length;

  const reasoning = [
    `Generated from ${observations.length} observation(s).`,
    topObs?.severity ? `Highest severity: ${topObs.severity}.` : null,
    context ? `Walking speed: ${context.walkingSpeed}, complexity: ${context.environmentComplexity}.` : null,
    `Verbosity: ${verbosity}, style: ${style}.`,
    confidence < 0.7 ? `Uncertainty language applied (avg confidence: ${Math.round(confidence * 100)}%).` : null,
  ].filter(Boolean).join(" ");

  return {
    id: randomUUID(),
    text,
    type: determineType(sorted),
    priority,
    confidence: Math.round(confidence * 100) / 100,
    verbosityLevel: verbosity,
    interruptibility,
    reasoning,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    metadata: { observationCount: observations.length, contextProvided: !!context },
  };
}

function determineType(observations: EnvironmentObservation[]): MessageType {
  const types = observations.map((o) => o.type.toLowerCase());
  if (types.some((t) => ["hazard", "drop-off", "obstacle", "stairs"].some((h) => t.includes(h)))) {
    return "hazard";
  }
  if (types.some((t) => ["guidance", "direction", "navigate"].some((g) => t.includes(g)))) {
    return "guidance";
  }
  return "status";
}
