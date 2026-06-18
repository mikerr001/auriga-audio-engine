import type {
  CandidateMessage,
  ScoredMessage,
  EnvironmentContext,
  Interruptibility,
  MessageType,
  HazardSeverity,
} from "./types.js";
import { state } from "./state.js";
import { isOverloaded } from "./cognitive.js";
import { logEvent } from "./observatory.js";

const TYPE_BASE_SCORE: Record<MessageType, number> = {
  hazard: 70,
  guidance: 50,
  alert: 60,
  status: 30,
  confidence: 20,
  system: 10,
};

const SEVERITY_BONUS: Record<string, number> = {
  critical: 30,
  high: 20,
  moderate: 10,
  low: 0,
};

const URGENCY_BONUS: Record<string, number> = {
  immediate: 25,
  high: 15,
  moderate: 8,
  low: 0,
};

function computeScore(
  msg: CandidateMessage,
  context?: EnvironmentContext
): number {
  let score = TYPE_BASE_SCORE[msg.type] ?? 20;

  score += msg.confidence * 15;

  if (msg.severity) {
    score += SEVERITY_BONUS[msg.severity] ?? 0;
  }

  const complexityBonus: Record<string, number> = {
    chaotic: 8,
    complex: 4,
    moderate: 2,
    simple: 0,
  };
  if (context) {
    score += complexityBonus[context.environmentComplexity] ?? 0;
  }

  if (msg.confidence < state.config.confidenceThreshold) {
    score *= 0.5;
  }

  return Math.min(100, Math.round(score));
}

function scoreToInterruptibility(score: number, type: MessageType, severity?: HazardSeverity | null): Interruptibility {
  if (type === "hazard" && severity === "critical") return "critical";
  if (type === "hazard" && severity === "high") return "urgent";
  if (score >= 85) return "critical";
  if (score >= 65) return "urgent";
  if (score >= 40) return "important";
  return "non-interruptible";
}

function buildReasoning(msg: CandidateMessage, score: number, suppressed: boolean): string {
  const parts: string[] = [];
  parts.push(`Base score for type '${msg.type}': ${TYPE_BASE_SCORE[msg.type] ?? 20}.`);
  if (msg.severity) parts.push(`Severity '${msg.severity}' adds ${SEVERITY_BONUS[msg.severity] ?? 0} points.`);
  parts.push(`Confidence ${Math.round(msg.confidence * 100)}% contributes ${Math.round(msg.confidence * 15)} points.`);
  if (msg.confidence < state.config.confidenceThreshold) parts.push(`Below confidence threshold (${state.config.confidenceThreshold}) — score halved.`);
  if (suppressed) parts.push("Suppressed: cognitive load at capacity.");
  parts.push(`Final score: ${score}.`);
  return parts.join(" ");
}

export function prioritizeMessages(
  messages: CandidateMessage[],
  context?: EnvironmentContext
): {
  ranked: ScoredMessage[];
  suppressed: ScoredMessage[];
  cognitiveLoadImpact: "minimal" | "moderate" | "high" | "critical";
} {
  const overloaded = isOverloaded();
  const scored = messages.map((msg) => {
    const score = computeScore(msg, context);
    const interruptibility = scoreToInterruptibility(score, msg.type, msg.severity);
    const willInterrupt = interruptibility === "critical" || interruptibility === "urgent";

    return { msg, score, interruptibility, willInterrupt };
  });

  scored.sort((a, b) => b.score - a.score);

  const MAX_RANKED = overloaded ? 3 : 8;
  const ranked: ScoredMessage[] = [];
  const suppressed: ScoredMessage[] = [];

  for (const s of scored) {
    const isCritical = s.interruptibility === "critical";
    const isLowConf = s.msg.confidence < state.config.confidenceThreshold && state.config.suppressLowConfidence;

    if (isLowConf && !isCritical) {
      suppressed.push({
        message: s.msg,
        score: s.score,
        reasoning: buildReasoning(s.msg, s.score, false) + " Suppressed: below confidence threshold.",
        willInterrupt: false,
        interruptibility: s.interruptibility,
      });
      continue;
    }

    if (ranked.length >= MAX_RANKED && !isCritical) {
      suppressed.push({
        message: s.msg,
        score: s.score,
        reasoning: buildReasoning(s.msg, s.score, true),
        willInterrupt: false,
        interruptibility: s.interruptibility,
      });
      continue;
    }

    ranked.push({
      message: s.msg,
      score: s.score,
      reasoning: buildReasoning(s.msg, s.score, false),
      willInterrupt: s.willInterrupt,
      interruptibility: s.interruptibility,
    });
  }

  if (suppressed.length > 0) {
    logEvent("priority-conflict", `${suppressed.length} message(s) suppressed during prioritization`, {
      metadata: { ranked: ranked.length, suppressed: suppressed.length, overloaded },
    });
  }

  let cognitiveLoadImpact: "minimal" | "moderate" | "high" | "critical";
  if (overloaded) {
    cognitiveLoadImpact = "critical";
  } else if (ranked.length > 5) {
    cognitiveLoadImpact = "high";
  } else if (ranked.length > 3) {
    cognitiveLoadImpact = "moderate";
  } else {
    cognitiveLoadImpact = "minimal";
  }

  return { ranked, suppressed, cognitiveLoadImpact };
}
