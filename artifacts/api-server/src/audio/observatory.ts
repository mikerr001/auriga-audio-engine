import { randomUUID } from "crypto";
import type { LogEntry, LogEntryType } from "./types.js";
import { state } from "./state.js";

const MAX_LOG_ENTRIES = 1000;

export function logEvent(
  type: LogEntryType,
  message: string,
  opts?: {
    priority?: number | null;
    confidence?: number | null;
    metadata?: Record<string, unknown>;
  }
): LogEntry {
  const entry: LogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    message,
    priority: opts?.priority ?? null,
    confidence: opts?.confidence ?? null,
    metadata: opts?.metadata,
  };

  state.log.unshift(entry);

  if (state.log.length > MAX_LOG_ENTRIES) {
    state.log = state.log.slice(0, MAX_LOG_ENTRIES);
  }

  return entry;
}

export function getLog(limit = 50, filterType?: string): { entries: LogEntry[]; totalCount: number } {
  let entries = state.log;

  if (filterType) {
    entries = entries.filter((e) => e.type === filterType);
  }

  return {
    entries: entries.slice(0, limit),
    totalCount: state.log.length,
  };
}
