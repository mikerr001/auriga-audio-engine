import type { AlertDescriptor, AlertType } from "./types.js";

const VOCABULARY: AlertDescriptor[] = [
  {
    id: "confirm-001",
    alertType: "confirmation",
    name: "Positive Acknowledgement",
    meaning: "Action completed successfully or safe path confirmed",
    usage: "Play after successful navigation past a landmark or when user completes a turn correctly",
    frequency: 880,
    duration: 150,
    pattern: "single",
    priority: 1,
  },
  {
    id: "confirm-002",
    alertType: "confirmation",
    name: "Double Confirmation",
    meaning: "Reached destination or significant milestone",
    usage: "Play when user arrives at a named destination or completes a navigation goal",
    frequency: 880,
    duration: 200,
    pattern: "double",
    priority: 2,
  },
  {
    id: "warn-001",
    alertType: "warning",
    name: "Attention Tone",
    meaning: "Moderate hazard present — proceed with caution",
    usage: "Precedes speech messages for hazards with severity 'moderate'",
    frequency: 660,
    duration: 250,
    pattern: "single",
    priority: 5,
  },
  {
    id: "warn-002",
    alertType: "warning",
    name: "Double Warning",
    meaning: "Multiple hazards in the environment — heightened caution needed",
    usage: "Play when hazard density exceeds 'moderate' threshold",
    frequency: 660,
    duration: 200,
    pattern: "double",
    priority: 6,
  },
  {
    id: "crit-001",
    alertType: "critical",
    name: "Stop Signal",
    meaning: "Immediate stop required — critical hazard detected",
    usage: "Always interrupts current speech. Used for drop-offs, stairs-down, and immediate-urgency hazards",
    frequency: 440,
    duration: 500,
    pattern: "triple",
    priority: 10,
  },
  {
    id: "crit-002",
    alertType: "critical",
    name: "Critical Descending",
    meaning: "Extreme danger — life-safety level threat",
    usage: "Reserved for severity=critical hazards within 0.5m. Never suppressed under any condition",
    frequency: 440,
    duration: 600,
    pattern: "descending",
    priority: 10,
  },
  {
    id: "nav-001",
    alertType: "navigation",
    name: "Turn Left Cue",
    meaning: "Navigation instruction: turn left",
    usage: "Accompanies turn-left guidance messages, providing a non-speech spatial cue",
    frequency: 523,
    duration: 180,
    pattern: "single",
    priority: 4,
  },
  {
    id: "nav-002",
    alertType: "navigation",
    name: "Turn Right Cue",
    meaning: "Navigation instruction: turn right",
    usage: "Accompanies turn-right guidance messages, providing a non-speech spatial cue",
    frequency: 659,
    duration: 180,
    pattern: "single",
    priority: 4,
  },
  {
    id: "nav-003",
    alertType: "navigation",
    name: "Forward Cue",
    meaning: "Clear path — continue forward",
    usage: "Played in short verbosity mode to signal a clear path without speech",
    frequency: 587,
    duration: 120,
    pattern: "single",
    priority: 3,
  },
  {
    id: "nav-004",
    alertType: "navigation",
    name: "Reassess Pulse",
    meaning: "Environment is complex — pause and evaluate",
    usage: "Played before reassess guidance messages or when complexity reaches 'chaotic'",
    frequency: 523,
    duration: 300,
    pattern: "ascending",
    priority: 5,
  },
  {
    id: "state-001",
    alertType: "state-change",
    name: "Engine Enabled",
    meaning: "Audio engine activated and processing",
    usage: "Play once when the audio engine transitions from disabled to enabled",
    frequency: 698,
    duration: 200,
    pattern: "ascending",
    priority: 2,
  },
  {
    id: "state-002",
    alertType: "state-change",
    name: "Engine Disabled",
    meaning: "Audio engine deactivated",
    usage: "Play once when the audio engine is intentionally disabled",
    frequency: 349,
    duration: 200,
    pattern: "descending",
    priority: 2,
  },
  {
    id: "state-003",
    alertType: "state-change",
    name: "Mode Change",
    meaning: "Verbosity or personality mode has changed",
    usage: "Play when user switches verbosity mode (short/normal/verbose/expert)",
    frequency: 523,
    duration: 150,
    pattern: "double",
    priority: 2,
  },
  {
    id: "state-004",
    alertType: "state-change",
    name: "Cognitive Overload Warning",
    meaning: "Message rate exceeds safe threshold — suppression active",
    usage: "Play when cognitive load transitions from moderate to high or critical",
    frequency: 440,
    duration: 350,
    pattern: "triple",
    priority: 7,
  },
  {
    id: "err-001",
    alertType: "error",
    name: "Sensor Failure",
    meaning: "Environmental sensing has degraded or failed",
    usage: "Play when confidence across all observations drops below 20% or no sensor data is received",
    frequency: 220,
    duration: 400,
    pattern: "descending",
    priority: 8,
  },
  {
    id: "err-002",
    alertType: "error",
    name: "Communication Failure",
    meaning: "Audio output pipeline has encountered an error",
    usage: "Play (via fallback channel) when primary speech synthesis fails",
    frequency: 220,
    duration: 300,
    pattern: "double",
    priority: 9,
  },
];

export function getVocabulary(): { alerts: AlertDescriptor[]; version: string } {
  return {
    alerts: VOCABULARY,
    version: "1.0.0",
  };
}

export function getAlertForType(alertType: AlertType, context?: string | null): AlertDescriptor {
  const matches = VOCABULARY.filter((v) => v.alertType === alertType);
  if (matches.length === 0) {
    return VOCABULARY[0];
  }

  if (context) {
    const ctx = context.toLowerCase();
    const contextMatch = matches.find((m) =>
      m.usage.toLowerCase().includes(ctx) || m.name.toLowerCase().includes(ctx)
    );
    if (contextMatch) return contextMatch;
  }

  return matches[0];
}
