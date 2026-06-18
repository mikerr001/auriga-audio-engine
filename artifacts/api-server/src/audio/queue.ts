import { randomUUID } from "crypto";
import type { AudioMessage, MessageType, HazardSeverity, Interruptibility } from "./types.js";
import { state } from "./state.js";
import { logEvent } from "./observatory.js";
import { recordSuppressed } from "./cognitive.js";

const MAX_QUEUE_SIZE = 50;
const WORDS_PER_SECOND = 2.5;

function estimateDuration(msg: AudioMessage): number {
  return msg.text.split(/\s+/).length / WORDS_PER_SECOND;
}

function isDuplicate(existing: AudioMessage, text: string): boolean {
  if (existing.text === text) return true;
  const a = existing.text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const b = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (a.length === 0 || b.length === 0) return false;
  const shorter = Math.min(a.length, b.length);
  const longer = Math.max(a.length, b.length);
  if (shorter / longer < 0.8) return false;
  let matches = 0;
  for (let i = 0; i < shorter; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / longer > 0.85;
}

function pruneExpired(): void {
  const now = new Date();
  const before = state.queue.length;
  state.queue = state.queue.filter((msg) => {
    if (!msg.expiresAt) return true;
    return new Date(msg.expiresAt) > now;
  });
  const removed = before - state.queue.length;
  if (removed > 0) {
    logEvent("system", `${removed} expired message(s) pruned from queue`);
  }
}

function sortQueue(): void {
  state.queue.sort((a, b) => b.priority - a.priority);
}

export interface EnqueueRequest {
  text: string;
  type: MessageType;
  confidence: number;
  severity?: HazardSeverity | null;
  interruptibility: Interruptibility;
  ttlSeconds?: number | null;
}

export function getQueueState(): {
  messages: AudioMessage[];
  totalCount: number;
  criticalCount: number;
  overloadRisk: boolean;
  estimatedDuration: number;
} {
  pruneExpired();
  const criticalCount = state.queue.filter((m) => m.interruptibility === "critical").length;
  const estimatedDuration = state.queue.reduce((s, m) => s + estimateDuration(m), 0);

  return {
    messages: [...state.queue],
    totalCount: state.queue.length,
    criticalCount,
    overloadRisk: state.queue.length > MAX_QUEUE_SIZE * 0.7,
    estimatedDuration: Math.round(estimatedDuration * 10) / 10,
  };
}

export function enqueue(req: EnqueueRequest): {
  message: AudioMessage;
  queuePosition: number;
  deduplicated: boolean;
  preempted: string[];
} {
  pruneExpired();

  const duplicate = state.queue.find((m) => isDuplicate(m, req.text));
  if (duplicate) {
    logEvent("queued", `Deduplicated message: "${req.text.slice(0, 60)}"`, {
      priority: duplicate.priority,
      confidence: req.confidence,
    });
    return {
      message: duplicate,
      queuePosition: state.queue.indexOf(duplicate),
      deduplicated: true,
      preempted: [],
    };
  }

  const priorityMap: Record<Interruptibility, number> = {
    critical: 95,
    urgent: 75,
    important: 50,
    "non-interruptible": 25,
  };

  const priority = priorityMap[req.interruptibility];

  const expiresAt = req.ttlSeconds != null
    ? new Date(Date.now() + req.ttlSeconds * 1000).toISOString()
    : null;

  const msg: AudioMessage = {
    id: randomUUID(),
    text: req.text,
    type: req.type,
    priority,
    confidence: req.confidence,
    verbosityLevel: state.config.verbosityMode,
    interruptibility: req.interruptibility,
    reasoning: `Manually enqueued with interruptibility '${req.interruptibility}'.`,
    expiresAt,
    createdAt: new Date().toISOString(),
    metadata: { severity: req.severity },
  };

  const preempted: string[] = [];

  if (state.queue.length >= MAX_QUEUE_SIZE) {
    const canRemove = state.queue.filter(
      (m) => m.priority < priority && m.interruptibility !== "critical"
    );
    if (canRemove.length > 0) {
      const victim = canRemove[canRemove.length - 1];
      preempted.push(victim.id);
      state.queue = state.queue.filter((m) => m.id !== victim.id);
      logEvent("interrupted", `Message preempted: "${victim.text.slice(0, 60)}"`, {
        priority: victim.priority,
        metadata: { preemptedBy: msg.id },
      });
      recordSuppressed();
    } else {
      logEvent("suppressed", `Queue full. Message dropped: "${req.text.slice(0, 60)}"`, {
        priority,
        confidence: req.confidence,
      });
      recordSuppressed();
      return { message: msg, queuePosition: -1, deduplicated: false, preempted: [] };
    }
  }

  state.queue.push(msg);
  sortQueue();

  const queuePosition = state.queue.indexOf(msg);

  logEvent("queued", `Enqueued: "${req.text.slice(0, 60)}"`, {
    priority,
    confidence: req.confidence,
    metadata: { interruptibility: req.interruptibility, queuePosition },
  });

  return { message: msg, queuePosition, deduplicated: false, preempted };
}

export function dequeue(messageId: string): { success: boolean; message: string } {
  const before = state.queue.length;
  state.queue = state.queue.filter((m) => m.id !== messageId);
  if (state.queue.length < before) {
    logEvent("system", `Message ${messageId} removed from queue`);
    return { success: true, message: "Message removed" };
  }
  return { success: false, message: "Message not found in queue" };
}

export function clearQueue(): { success: boolean; message: string } {
  const criticals = state.queue.filter((m) => m.interruptibility === "critical");
  const removed = state.queue.length - criticals.length;
  state.queue = criticals;
  logEvent("system", `Queue cleared: ${removed} non-critical messages removed, ${criticals.length} critical retained`);
  return { success: true, message: `Cleared ${removed} messages (${criticals.length} critical retained)` };
}
