import { useState } from "react";
import { useGetObservatoryLog, getGetObservatoryLogQueryKey } from "@workspace/api-client-react";

const LOG_TYPES = ["", "spoken", "interrupted", "queued", "suppressed", "priority-conflict", "overload", "queue-conflict", "system", "failure"];

function LogTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    spoken: "text-safe border-safe bg-safe/10",
    interrupted: "text-warning border-warning bg-warning/10",
    queued: "text-info border-info bg-info/10",
    suppressed: "text-muted-foreground border-border",
    "priority-conflict": "text-warning border-warning bg-warning/10",
    overload: "text-critical border-critical bg-critical/10",
    "queue-conflict": "text-warning border-warning bg-warning/10",
    system: "text-muted-foreground border-border",
    failure: "text-critical border-critical bg-critical/10",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${cfg[type] ?? "text-muted-foreground border-border"}`}>{type.toUpperCase()}</span>;
}

export default function Observatory() {
  const [filterType, setFilterType] = useState("");
  const [limit, setLimit] = useState(50);

  const { data, isLoading } = useGetObservatoryLog(
    { limit, type: filterType || undefined },
    { query: { queryKey: getGetObservatoryLogQueryKey({ limit, type: filterType || undefined }), refetchInterval: 5000 } }
  );

  const entries = data?.entries ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-wide">OBSERVATORY</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Structured log of all audio engine events — refreshes every 5s</p>
        </div>
        <div className="font-mono text-xs text-muted-foreground">{data?.totalCount ?? 0} total entries</div>
      </div>

      <div className="flex items-center gap-3">
        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-1">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="select-log-type-filter"
          >
            {LOG_TYPES.map((t) => <option key={t} value={t}>{t || "— all types —"}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-1">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            data-testid="select-log-limit"
          >
            {[25, 50, 100, 200].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg">
        <div className="p-3 border-b border-border flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
          <span className="w-24">Time</span>
          <span className="w-32">Type</span>
          <span className="flex-1">Message</span>
          <span className="w-16 text-right">Priority</span>
          <span className="w-16 text-right">Confidence</span>
        </div>
        {isLoading ? (
          <div className="p-6 text-center font-mono text-xs text-muted-foreground">Loading log...</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center font-mono text-xs text-muted-foreground">No log entries yet — interact with the engine to generate events</div>
        ) : (
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="px-3 py-2 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <div className="w-32 shrink-0"><LogTypeBadge type={entry.type} /></div>
                <div className="flex-1 font-mono text-xs text-foreground" data-testid={`text-log-entry-${entry.id}`}>{entry.message}</div>
                <span className="w-16 text-right font-mono text-xs text-muted-foreground shrink-0">{entry.priority ?? "—"}</span>
                <span className="w-16 text-right font-mono text-xs text-muted-foreground shrink-0">
                  {entry.confidence != null ? `${Math.round(entry.confidence * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
