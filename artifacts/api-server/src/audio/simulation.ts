import { randomUUID } from "crypto";
import type {
  SimulationScenario,
  SimulationEvent,
  AudioMessage,
  ResearchDebtEntry,
  AudioConfig,
} from "./types.js";
import { generateHazardMessage } from "./hazard.js";
import { generateGuidanceMessage } from "./guidance.js";
import { synthesizeSpeech } from "./speech.js";
import { prioritizeMessages } from "./priority.js";
import { state } from "./state.js";
import { logEvent } from "./observatory.js";

export const BUILT_IN_SCENARIOS: SimulationScenario[] = [
  {
    id: "normal-corridor",
    name: "Normal Corridor Navigation",
    description: "User navigates a typical indoor corridor with a door and mild obstacle.",
    category: "normal",
    eventCount: 5,
    expectedMessages: 5,
    adversarial: false,
  },
  {
    id: "crowded-space",
    name: "Crowded Public Space",
    description: "Multiple obstacles in rapid succession in a busy area — tests message deduplication and suppression.",
    category: "crowded",
    eventCount: 15,
    expectedMessages: 8,
    adversarial: false,
  },
  {
    id: "hazard-dense",
    name: "Hazard-Dense Environment",
    description: "Drop-off, stairs, and narrow passage in close proximity — tests critical hazard prioritization.",
    category: "hazard-dense",
    eventCount: 6,
    expectedMessages: 6,
    adversarial: false,
  },
  {
    id: "rapid-guidance",
    name: "Rapid Guidance Changes",
    description: "Rapid direction changes required — tests progressive urgency and queue management.",
    category: "rapid-guidance",
    eventCount: 8,
    expectedMessages: 8,
    adversarial: false,
  },
  {
    id: "high-uncertainty",
    name: "High Uncertainty Environment",
    description: "All observations have low confidence — tests uncertainty language and suppression of low-confidence messages.",
    category: "high-uncertainty",
    eventCount: 7,
    expectedMessages: 4,
    adversarial: false,
  },
  {
    id: "message-overload",
    name: "Message Overload (Adversarial)",
    description: "Attempts to overwhelm the system with 30 messages in 10 seconds — tests cognitive load protection.",
    category: "overload",
    eventCount: 30,
    expectedMessages: 10,
    adversarial: true,
  },
  {
    id: "conflicting-priorities",
    name: "Conflicting Priorities (Adversarial)",
    description: "Multiple critical and urgent messages simultaneously — tests priority arbitration and preemption.",
    category: "conflicting-priorities",
    eventCount: 10,
    expectedMessages: 6,
    adversarial: true,
  },
  {
    id: "dynamic-hazard",
    name: "Dynamic Moving Hazard",
    description: "Hazard changes direction and severity over time — tests expiry and update handling.",
    category: "dynamic-hazard",
    eventCount: 8,
    expectedMessages: 6,
    adversarial: false,
  },
];

function buildScenarioEvents(scenarioId: string): SimulationEvent[] {
  switch (scenarioId) {
    case "normal-corridor":
      return [
        { timeOffsetMs: 0, type: "guidance", payload: { direction: "forward", urgency: "low" } },
        { timeOffsetMs: 1000, type: "hazard", payload: { hazardType: "door", severity: "low", distance: 3, direction: "ahead", confidence: 0.95, urgency: "low" } },
        { timeOffsetMs: 2500, type: "guidance", payload: { direction: "forward", urgency: "moderate" } },
        { timeOffsetMs: 3500, type: "hazard", payload: { hazardType: "obstacle", severity: "moderate", distance: 1.5, direction: "slightly-left", confidence: 0.88, urgency: "moderate" } },
        { timeOffsetMs: 5000, type: "guidance", payload: { direction: "right", urgency: "low" } },
      ];

    case "crowded-space":
      return Array.from({ length: 15 }, (_, i) => ({
        timeOffsetMs: i * 200,
        type: "hazard" as const,
        payload: {
          hazardType: "obstacle",
          severity: "moderate",
          distance: 1.5 + (i % 3) * 0.5,
          direction: i % 2 === 0 ? "ahead" : "slightly-left",
          confidence: 0.7 + (i % 3) * 0.1,
          urgency: "moderate",
        },
      }));

    case "hazard-dense":
      return [
        { timeOffsetMs: 0, type: "hazard", payload: { hazardType: "drop-off", severity: "critical", distance: 0.5, direction: "ahead", confidence: 0.97, urgency: "immediate" } },
        { timeOffsetMs: 500, type: "hazard", payload: { hazardType: "stairs-down", severity: "high", distance: 1.0, direction: "right", confidence: 0.92, urgency: "high" } },
        { timeOffsetMs: 1000, type: "hazard", payload: { hazardType: "narrow-passage", severity: "moderate", distance: 2.5, direction: "ahead", confidence: 0.85, urgency: "low" } },
        { timeOffsetMs: 2000, type: "guidance", payload: { direction: "stop", urgency: "immediate" } },
        { timeOffsetMs: 2500, type: "guidance", payload: { direction: "back", urgency: "high" } },
        { timeOffsetMs: 3500, type: "guidance", payload: { direction: "left", urgency: "moderate" } },
      ];

    case "rapid-guidance":
      return [
        { timeOffsetMs: 0, type: "guidance", payload: { direction: "forward", urgency: "low" } },
        { timeOffsetMs: 800, type: "guidance", payload: { direction: "left", urgency: "moderate" } },
        { timeOffsetMs: 1200, type: "guidance", payload: { direction: "forward", urgency: "high" } },
        { timeOffsetMs: 1500, type: "guidance", payload: { direction: "right", urgency: "high" } },
        { timeOffsetMs: 1800, type: "guidance", payload: { direction: "stop", urgency: "immediate" } },
        { timeOffsetMs: 2200, type: "guidance", payload: { direction: "reassess", urgency: "moderate" } },
        { timeOffsetMs: 3000, type: "guidance", payload: { direction: "left", urgency: "low" } },
        { timeOffsetMs: 4000, type: "guidance", payload: { direction: "forward", urgency: "low" } },
      ];

    case "high-uncertainty":
      return [
        { timeOffsetMs: 0, type: "hazard", payload: { hazardType: "unknown", severity: "moderate", distance: 2.0, direction: "ahead", confidence: 0.35, urgency: "moderate" } },
        { timeOffsetMs: 1000, type: "hazard", payload: { hazardType: "obstacle", severity: "low", distance: 3.0, direction: "left", confidence: 0.25, urgency: "low" } },
        { timeOffsetMs: 2000, type: "hazard", payload: { hazardType: "drop-off", severity: "high", distance: 1.0, direction: "ahead", confidence: 0.45, urgency: "high" } },
        { timeOffsetMs: 3000, type: "hazard", payload: { hazardType: "surface-change", severity: "low", distance: 1.5, direction: "ahead", confidence: 0.55, urgency: "low" } },
        { timeOffsetMs: 4000, type: "guidance", payload: { direction: "slow-down", urgency: "moderate" } },
        { timeOffsetMs: 5000, type: "hazard", payload: { hazardType: "stairs-down", severity: "high", distance: 2.0, direction: "ahead", confidence: 0.40, urgency: "high" } },
        { timeOffsetMs: 6000, type: "guidance", payload: { direction: "stop", urgency: "immediate" } },
      ];

    case "message-overload":
      return Array.from({ length: 30 }, (_, i) => ({
        timeOffsetMs: i * 50,
        type: i % 3 === 0 ? "hazard" as const : "guidance" as const,
        payload: i % 3 === 0
          ? { hazardType: "obstacle", severity: "moderate", distance: 2, direction: "ahead", confidence: 0.8, urgency: "moderate" }
          : { direction: "forward", urgency: "low" },
      }));

    case "conflicting-priorities":
      return [
        { timeOffsetMs: 0, type: "hazard", payload: { hazardType: "drop-off", severity: "critical", distance: 0.3, direction: "ahead", confidence: 0.99, urgency: "immediate" } },
        { timeOffsetMs: 50, type: "hazard", payload: { hazardType: "stairs-down", severity: "critical", distance: 0.5, direction: "right", confidence: 0.95, urgency: "immediate" } },
        { timeOffsetMs: 100, type: "guidance", payload: { direction: "stop", urgency: "immediate" } },
        { timeOffsetMs: 150, type: "hazard", payload: { hazardType: "obstacle", severity: "high", distance: 0.8, direction: "left", confidence: 0.90, urgency: "high" } },
        { timeOffsetMs: 200, type: "guidance", payload: { direction: "back", urgency: "immediate" } },
        { timeOffsetMs: 250, type: "hazard", payload: { hazardType: "narrow-passage", severity: "moderate", distance: 2.0, direction: "ahead", confidence: 0.75, urgency: "moderate" } },
        { timeOffsetMs: 300, type: "guidance", payload: { direction: "reassess", urgency: "high" } },
        { timeOffsetMs: 400, type: "hazard", payload: { hazardType: "surface-change", severity: "low", distance: 3.0, direction: "ahead", confidence: 0.6, urgency: "low" } },
        { timeOffsetMs: 500, type: "guidance", payload: { direction: "left", urgency: "moderate" } },
        { timeOffsetMs: 600, type: "guidance", payload: { direction: "forward", urgency: "low" } },
      ];

    case "dynamic-hazard":
      return [
        { timeOffsetMs: 0, type: "hazard", payload: { hazardType: "obstacle", severity: "low", distance: 4.0, direction: "ahead", confidence: 0.7, urgency: "low" } },
        { timeOffsetMs: 500, type: "hazard", payload: { hazardType: "obstacle", severity: "moderate", distance: 3.0, direction: "ahead", confidence: 0.8, urgency: "moderate" } },
        { timeOffsetMs: 1000, type: "hazard", payload: { hazardType: "obstacle", severity: "high", distance: 2.0, direction: "ahead", confidence: 0.88, urgency: "high" } },
        { timeOffsetMs: 1500, type: "guidance", payload: { direction: "slow-down", urgency: "high" } },
        { timeOffsetMs: 2000, type: "hazard", payload: { hazardType: "obstacle", severity: "critical", distance: 0.5, direction: "ahead", confidence: 0.95, urgency: "immediate" } },
        { timeOffsetMs: 2100, type: "guidance", payload: { direction: "stop", urgency: "immediate" } },
        { timeOffsetMs: 3000, type: "hazard", payload: { hazardType: "obstacle", severity: "moderate", distance: 2.0, direction: "left", confidence: 0.8, urgency: "moderate" } },
        { timeOffsetMs: 4000, type: "guidance", payload: { direction: "right", urgency: "moderate" } },
      ];

    default:
      return [];
  }
}

function processEvent(event: SimulationEvent): AudioMessage | null {
  try {
    if (event.type === "hazard") {
      const p = event.payload as Record<string, unknown>;
      return generateHazardMessage({
        hazardType: (p["hazardType"] as string ?? "unknown") as never,
        severity: (p["severity"] as string ?? "moderate") as never,
        distance: (p["distance"] as number) ?? 2,
        direction: (p["direction"] as string ?? "ahead") as never,
        confidence: (p["confidence"] as number) ?? 0.8,
        urgency: (p["urgency"] as string ?? "moderate") as never,
      });
    }
    if (event.type === "guidance") {
      const p = event.payload as Record<string, unknown>;
      return generateGuidanceMessage({
        direction: (p["direction"] as string ?? "forward") as never,
        urgency: (p["urgency"] as string ?? "moderate") as never,
        context: (p["context"] as string | null) ?? null,
        distanceMeters: (p["distanceMeters"] as number | null) ?? null,
      });
    }
    if (event.type === "status") {
      const observations = [{
        type: "status",
        description: (event.payload["description"] as string) ?? "System status update",
        confidence: 1.0,
      }];
      return synthesizeSpeech(observations, undefined);
    }
    return null;
  } catch {
    return null;
  }
}

function generateSimulationResearchDebt(
  scenarioId: string | null,
  messagesSpoken: number,
  messagesSuppressed: number,
  safetyViolations: number,
  priorityConflicts: number
): ResearchDebtEntry[] {
  const debt: ResearchDebtEntry[] = [];
  const now = new Date().toISOString();

  debt.push({
    id: randomUUID(),
    category: "speech-model",
    title: "Rule-based speech generation lacks contextual naturalness",
    description: "The current speech generation uses template-based rules. Natural language generation (NLG) or LLM-based generation would produce more natural, context-aware utterances.",
    severity: "medium",
    impact: "Users may find speech unnatural or repetitive over extended use sessions",
    assumptions: [
      "Template-based generation is sufficient for safety-critical use",
      "Naturalness is less important than predictability in accessibility contexts",
    ],
    failureModes: [
      "Repetitive speech patterns could cause users to ignore messages",
      "Templates may not cover all environmental edge cases",
    ],
    createdAt: now,
  });

  if (messagesSuppressed > 0) {
    debt.push({
      id: randomUUID(),
      category: "cognitive-load",
      title: "Cognitive load model lacks user adaptation",
      description: `${messagesSuppressed} messages were suppressed in this scenario. The current model uses a fixed messages-per-minute threshold without adapting to individual user capacity or task engagement level.`,
      severity: "high",
      impact: "Safety messages could be suppressed for users with higher cognitive tolerance. Novice users may still be overloaded at the current threshold.",
      assumptions: [
        "A fixed messages-per-minute threshold is appropriate for all users",
        "Suppressed messages are recoverable from context",
      ],
      failureModes: [
        "Critical hazard information suppressed during overload state",
        "Threshold too low for expert users, too high for novice users",
      ],
      createdAt: now,
    });
  }

  if (safetyViolations > 0) {
    debt.push({
      id: randomUUID(),
      category: "failure-mode",
      title: `Safety violations detected in ${scenarioId ?? "custom"} scenario`,
      description: `${safetyViolations} safety violation(s) detected where critical hazard messages may have been delayed or suppressed.`,
      severity: "critical",
      impact: "Safety-critical information may not reach the user in time to prevent harm",
      assumptions: [
        "Priority engine correctly identifies all safety-critical messages",
        "Queue always delivers critical messages before non-critical ones",
      ],
      failureModes: [
        "Priority inversion under extreme message load",
        "Critical message expiry before delivery",
      ],
      createdAt: now,
    });
  }

  if (priorityConflicts > 0) {
    debt.push({
      id: randomUUID(),
      category: "priority-model",
      title: "Priority arbitration under simultaneous critical events is untested with real users",
      description: `${priorityConflicts} priority conflicts were detected. When two critical events occur simultaneously (e.g., drop-off + stairs), the ordering is deterministic but has not been validated with users.`,
      severity: "high",
      impact: "Users may receive the wrong critical message first, leading to incorrect action",
      assumptions: [
        "Alphabetical/score-based tiebreaking produces the safest message ordering",
        "Users can act on sequential critical messages within the response window",
      ],
      failureModes: [
        "Wrong critical hazard spoken first; user reacts to secondary hazard",
        "Simultaneous critical messages cause confusion rather than clarity",
      ],
      createdAt: now,
    });
  }

  debt.push({
    id: randomUUID(),
    category: "user-study",
    title: "All performance thresholds derived from literature, not validated with target population",
    description: "Message rate limits, confidence thresholds, and priority weights are derived from general cognitive load literature and not from studies with blind or low-vision users using assistive technology.",
    severity: "high",
    impact: "System may be calibrated incorrectly for the actual target population",
    assumptions: [
      "General cognitive load research generalizes to visually impaired users under navigation stress",
      "2.5 words/second speech rate assumption holds across TTS engines and user contexts",
    ],
    failureModes: [
      "Thresholds set too conservatively, under-informing expert users",
      "Thresholds set too aggressively, overwhelming novice users",
    ],
    createdAt: now,
  });

  return debt;
}

function identifyWeaknesses(
  events: SimulationEvent[],
  messages: AudioMessage[],
  suppressed: number,
  safetyViolations: number
): string[] {
  const weaknesses: string[] = [];

  if (suppressed > events.length * 0.3) {
    weaknesses.push(`High suppression rate: ${suppressed} of ${events.length} messages suppressed (${Math.round(suppressed / events.length * 100)}%). Cognitive load protection may be over-aggressive.`);
  }

  if (safetyViolations > 0) {
    weaknesses.push(`${safetyViolations} safety violation(s): Critical hazard messages may have been delayed or suppressed. This is a constitutional violation.`);
  }

  const criticals = events.filter((e) => e.payload["severity"] === "critical" || e.payload["urgency"] === "immediate");
  const criticalMessages = messages.filter((m) => m.interruptibility === "critical");
  if (criticals.length > criticalMessages.length) {
    weaknesses.push(`Priority leakage: ${criticals.length} critical events produced only ${criticalMessages.length} critical messages. Some critical events may have been downgraded.`);
  }

  if (events.length > 20 && messages.length < events.length * 0.5) {
    weaknesses.push("Extreme suppression under high event density. Consider progressive urgency escalation to communicate load state to user.");
  }

  const duplicateTexts = new Set<string>();
  for (const m of messages) {
    if (duplicateTexts.has(m.text)) {
      weaknesses.push("Duplicate message text detected in output — deduplication may not be working correctly for this scenario pattern.");
      break;
    }
    duplicateTexts.add(m.text);
  }

  if (weaknesses.length === 0) {
    weaknesses.push("No critical weaknesses detected in this scenario. Adversarial testing recommended to find edge cases.");
  }

  return weaknesses;
}

export function getScenarios(): SimulationScenario[] {
  return BUILT_IN_SCENARIOS;
}

export function runSimulation(
  scenarioId: string | null,
  customEvents: SimulationEvent[] | null,
  configOverride: Partial<AudioConfig> | null
): {
  scenarioId: string | null;
  scenarioName: string;
  totalEvents: number;
  messagesSpoken: number;
  messagesSuppressed: number;
  messagesInterrupted: number;
  cognitiveLoadPeak: "none" | "low" | "moderate" | "high" | "critical";
  priorityConflicts: number;
  overloadEvents: number;
  safetyViolations: number;
  outputMessages: AudioMessage[];
  researchDebt: ResearchDebtEntry[];
  weaknesses: string[];
  assumptions: string[];
  duration: number;
} {
  const startTime = Date.now();

  const savedConfig = { ...state.config };
  if (configOverride) {
    Object.assign(state.config, configOverride);
  }

  let events: SimulationEvent[];
  let scenarioName: string;
  let scenario: SimulationScenario | null = null;

  if (scenarioId) {
    scenario = BUILT_IN_SCENARIOS.find((s) => s.id === scenarioId) ?? null;
    events = buildScenarioEvents(scenarioId);
    scenarioName = scenario?.name ?? scenarioId;
  } else if (customEvents && customEvents.length > 0) {
    events = customEvents;
    scenarioName = "Custom Simulation";
  } else {
    events = buildScenarioEvents("normal-corridor");
    scenarioName = "Default: Normal Corridor Navigation";
  }

  const outputMessages: AudioMessage[] = [];
  let messagesInterrupted = 0;
  let priorityConflicts = 0;
  let overloadEvents = 0;
  let safetyViolations = 0;

  const MAX_MESSAGES_PER_WINDOW = state.config.maxMessagesPerMinute;
  let messageCountInWindow = 0;
  const WINDOW_MS = 60000;
  let windowStart = 0;

  const currentTime = events[0]?.timeOffsetMs ?? 0;
  windowStart = currentTime;

  for (const event of events) {
    if (event.timeOffsetMs - windowStart > WINDOW_MS) {
      windowStart = event.timeOffsetMs;
      messageCountInWindow = 0;
    }

    if (messageCountInWindow >= MAX_MESSAGES_PER_WINDOW) {
      const isCritical = event.payload["severity"] === "critical" || event.payload["urgency"] === "immediate";
      if (!isCritical) {
        overloadEvents++;
        logEvent("overload", `Simulation: message suppressed (cognitive load limit)`, { metadata: { eventType: event.type } });
        continue;
      }
    }

    const prevCount = outputMessages.length;
    const msg = processEvent(event);

    if (msg) {
      const prevHigh = outputMessages.filter((m) => m.priority >= 80);
      if (prevHigh.length > 0 && msg.priority >= 80) {
        priorityConflicts++;
        logEvent("priority-conflict", `Simulation: priority conflict between messages`, {
          priority: msg.priority,
          metadata: { conflictCount: priorityConflicts },
        });
      }

      if (msg.interruptibility === "critical" && outputMessages.length > 0) {
        const lastMsg = outputMessages[outputMessages.length - 1];
        if (lastMsg.interruptibility !== "critical" && lastMsg.interruptibility !== "non-interruptible") {
          messagesInterrupted++;
        }
      }

      const isCriticalHazard = event.type === "hazard" && (event.payload["severity"] === "critical" || event.payload["urgency"] === "immediate");
      if (isCriticalHazard && msg.priority < 80) {
        safetyViolations++;
      }

      outputMessages.push(msg);
      messageCountInWindow++;
    } else {
      if (outputMessages.length === prevCount) {
        overloadEvents++;
      }
    }
  }

  const messagesSuppressed = events.length - outputMessages.length;

  const freq = outputMessages.length / Math.max(1, (events[events.length - 1]?.timeOffsetMs ?? 1000) / 60000);
  let cognitiveLoadPeak: "none" | "low" | "moderate" | "high" | "critical" = "none";
  if (freq >= MAX_MESSAGES_PER_WINDOW * 1.5) cognitiveLoadPeak = "critical";
  else if (freq >= MAX_MESSAGES_PER_WINDOW) cognitiveLoadPeak = "high";
  else if (freq >= MAX_MESSAGES_PER_WINDOW * 0.7) cognitiveLoadPeak = "moderate";
  else if (freq >= MAX_MESSAGES_PER_WINDOW * 0.4) cognitiveLoadPeak = "low";

  const researchDebt = generateSimulationResearchDebt(
    scenarioId,
    outputMessages.length,
    messagesSuppressed,
    safetyViolations,
    priorityConflicts
  );

  for (const entry of researchDebt) {
    if (!state.researchDebt.find((e) => e.title === entry.title)) {
      state.researchDebt.push(entry);
    }
  }

  const weaknesses = identifyWeaknesses(events, outputMessages, messagesSuppressed, safetyViolations);

  const assumptions = [
    "Walking speed assumed constant throughout scenario.",
    "Environmental observations are instantaneous snapshots, not continuous streams.",
    "User response time to audio cues is not modeled.",
    "TTS synthesis latency is not factored into message timing.",
    "All confidence values are assumed accurate (no sensor noise model).",
    "Message ordering within the same priority tier is deterministic (FIFO).",
  ];

  Object.assign(state.config, savedConfig);

  return {
    scenarioId,
    scenarioName,
    totalEvents: events.length,
    messagesSpoken: outputMessages.length,
    messagesSuppressed: Math.max(0, messagesSuppressed),
    messagesInterrupted,
    cognitiveLoadPeak,
    priorityConflicts,
    overloadEvents,
    safetyViolations,
    outputMessages,
    researchDebt,
    weaknesses,
    assumptions,
    duration: Date.now() - startTime,
  };
}
