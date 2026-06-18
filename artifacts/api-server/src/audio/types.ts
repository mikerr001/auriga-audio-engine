export type VerbosityMode = "short" | "normal" | "verbose" | "expert";
export type PersonalityStyle = "minimal" | "standard" | "detailed" | "research" | "developer";
export type Interruptibility = "non-interruptible" | "important" | "urgent" | "critical";
export type MessageType = "hazard" | "guidance" | "status" | "confidence" | "alert" | "system";
export type HazardSeverity = "low" | "moderate" | "high" | "critical";
export type GuidanceDirection = "forward" | "left" | "right" | "stop" | "slow-down" | "reassess" | "back";
export type HazardType = "obstacle" | "drop-off" | "stairs-down" | "stairs-up" | "door" | "narrow-passage" | "surface-change" | "unknown";
export type AlertType = "confirmation" | "warning" | "critical" | "navigation" | "state-change" | "error";
export type OverloadRisk = "none" | "low" | "moderate" | "high" | "critical";
export type LogEntryType = "spoken" | "interrupted" | "queued" | "suppressed" | "priority-conflict" | "overload" | "queue-conflict" | "system" | "failure";

export interface AudioMessage {
  id: string;
  text: string;
  type: MessageType;
  priority: number;
  confidence: number;
  verbosityLevel: VerbosityMode;
  interruptibility: Interruptibility;
  reasoning: string;
  expiresAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface EnvironmentObservation {
  type: string;
  description: string;
  distance?: number | null;
  direction?: string | null;
  confidence: number;
  severity?: HazardSeverity | null;
}

export interface EnvironmentContext {
  walkingSpeed: "stationary" | "slow" | "normal" | "fast";
  environmentComplexity: "simple" | "moderate" | "complex" | "chaotic";
  hazardDensity: "none" | "low" | "moderate" | "high";
  userPreference?: VerbosityMode;
}

export interface AudioConfig {
  verbosityMode: VerbosityMode;
  personalityStyle: PersonalityStyle;
  speechRate: number;
  confidenceThreshold: number;
  maxMessagesPerMinute: number;
  enabled: boolean;
  suppressLowConfidence: boolean;
}

export interface CandidateMessage {
  id: string;
  text: string;
  type: MessageType;
  confidence: number;
  severity?: HazardSeverity | null;
}

export interface ScoredMessage {
  message: CandidateMessage;
  score: number;
  reasoning: string;
  willInterrupt: boolean;
  interruptibility: Interruptibility;
}

export interface HazardInput {
  hazardType: HazardType;
  severity: HazardSeverity;
  distance: number;
  direction: "ahead" | "left" | "right" | "slightly-left" | "slightly-right" | "behind";
  confidence: number;
  urgency: "low" | "moderate" | "high" | "immediate";
}

export interface GuidanceInput {
  direction: GuidanceDirection;
  urgency: "low" | "moderate" | "high" | "immediate";
  context?: string | null;
  distanceMeters?: number | null;
}

export interface AlertDescriptor {
  id: string;
  alertType: AlertType;
  name: string;
  meaning: string;
  usage: string;
  frequency?: number | null;
  duration?: number | null;
  pattern?: string | null;
  priority: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogEntryType;
  message: string;
  priority?: number | null;
  confidence?: number | null;
  metadata?: Record<string, unknown>;
}

export interface ResearchDebtEntry {
  id: string;
  category: "speech-model" | "priority-model" | "cognitive-load" | "hazard-detection" | "user-study" | "tts-integration" | "multilingual" | "failure-mode";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  impact: string;
  assumptions: string[];
  failureModes: string[];
  createdAt: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  category: "crowded" | "hazard-dense" | "rapid-guidance" | "high-uncertainty" | "overload" | "conflicting-priorities" | "dynamic-hazard" | "normal";
  eventCount: number;
  expectedMessages: number;
  adversarial: boolean;
}

export interface SimulationEvent {
  timeOffsetMs: number;
  type: MessageType;
  payload: Record<string, unknown>;
}

export interface ValidationCheckItem {
  id: string;
  description: string;
  method: string;
  acceptanceCriteria: string;
  priority: "required" | "recommended" | "optional";
}
