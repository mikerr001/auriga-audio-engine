import { useGetQueue, getGetQueueQueryKey, useGetCognitiveLoad, getGetCognitiveLoadQueryKey, useGetObservatoryLog, getGetObservatoryLogQueryKey, useGetAudioConfig, getGetAudioConfigQueryKey, useUpdateAudioConfig } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

function OverloadBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    none: "text-safe border-safe bg-safe",
    low: "text-safe border-safe bg-safe",
    moderate: "text-warning border-warning bg-warning",
    high: "text-warning border-warning bg-warning",
    critical: "text-critical border-critical bg-critical",
  };
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${colors[risk] ?? "text-muted-foreground border-border"}`}>
      {risk.toUpperCase()}
    </span>
  );
}

function InterruptBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "non-interruptible": "text-muted-foreground border-border",
    important: "text-info border-info bg-info",
    urgent: "text-warning border-warning bg-warning",
    critical: "text-critical border-critical bg-critical glow-critical",
  };
  return (
    <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${colors[level] ?? ""}`}>
      {level.replace("non-interruptible", "NON-INT").toUpperCase()}
    </span>
  );
}

function LogTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    spoken: "text-safe border-safe",
    interrupted: "text-warning border-warning",
    queued: "text-info border-info",
    suppressed: "text-muted-foreground border-border",
    "priority-conflict": "text-warning border-warning",
    overload: "text-critical border-critical",
    "queue-conflict": "text-warning border-warning",
    system: "text-muted-foreground border-border",
    failure: "text-critical border-critical",
  };
  return (
    <span className={`font-mono text-xs px-1.5 py-0.5 rounded border ${colors[type] ?? "text-muted-foreground border-border"}`}>
      {type.toUpperCase()}
    </span>
  );
}

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: queue } = useGetQueue({ query: { queryKey: getGetQueueQueryKey(), refetchInterval: 3000 } });
  const { data: load } = useGetCognitiveLoad({ query: { queryKey: getGetCognitiveLoadQueryKey(), refetchInterval: 3000 } });
  const { data: log } = useGetObservatoryLog({ limit: 12 }, { query: { queryKey: getGetObservatoryLogQueryKey({ limit: 12 }), refetchInterval: 5000 } });
  const { data: config } = useGetAudioConfig({ query: { queryKey: getGetAudioConfigQueryKey() } });
  const updateConfig = useUpdateAudioConfig();

  const handleToggleEngine = () => {
    if (!config) return;
    updateConfig.mutate({ data: { ...config, enabled: !config.enabled } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetAudioConfigQueryKey() }),
    });
  };

  const userBurden = load?.userBurden ?? 0;
  const burdenPct = Math.round(userBurden * 100);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold text-foreground tracking-wide">MISSION CONTROL</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Live audio engine telemetry</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs ${config?.enabled ? "text-safe" : "text-critical"}`}>
            ENGINE {config?.enabled ? "ACTIVE" : "DISABLED"}
          </span>
          <button
            data-testid="button-toggle-engine"
            onClick={handleToggleEngine}
            className={`px-4 py-1.5 font-mono text-xs rounded border transition-all ${
              config?.enabled
                ? "border-critical text-critical hover:bg-critical hover:text-white"
                : "border-safe text-safe hover:bg-safe hover:text-black"
            }`}
          >
            {config?.enabled ? "DISABLE" : "ENABLE"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-1">QUEUE DEPTH</div>
          <div className="font-mono text-3xl font-bold text-foreground">{queue?.totalCount ?? 0}</div>
          <div className="font-mono text-xs text-muted-foreground mt-1">
            {queue?.criticalCount ?? 0} critical
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-1">OVERLOAD RISK</div>
          <div className="mt-1"><OverloadBadge risk={queue?.overloadRisk ? "high" : "none"} /></div>
          <div className="font-mono text-xs text-muted-foreground mt-2">
            {(queue?.estimatedDuration ?? 0).toFixed(1)}s estimated
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-1">MSG FREQUENCY</div>
          <div className="font-mono text-3xl font-bold text-foreground">{load?.messageFrequency ?? 0}</div>
          <div className="font-mono text-xs text-muted-foreground mt-1">/min in window</div>
        </div>
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-1">VERBOSITY MODE</div>
          <div className="font-mono text-xl font-bold text-info uppercase">{config?.verbosityMode ?? "—"}</div>
          <div className="font-mono text-xs text-muted-foreground mt-1 uppercase">{config?.personalityStyle ?? ""}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Cognitive Load Monitor</div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-muted-foreground">User Burden</span>
            <span className={`font-mono text-sm font-bold ${burdenPct >= 80 ? "text-critical" : burdenPct >= 50 ? "text-warning" : "text-safe"}`}>
              {burdenPct}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full transition-all ${burdenPct >= 80 ? "bg-destructive glow-critical" : burdenPct >= 50 ? "bg-warning glow-warning" : "bg-chart-2 glow-safe"}`}
              style={{ width: `${burdenPct}%` }}
              data-testid="bar-cognitive-burden"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Load Risk</span>
            <OverloadBadge risk={load?.overloadRisk ?? "none"} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-mono text-xs text-muted-foreground">Suppressed</span>
            <span className="font-mono text-xs text-foreground">{load?.suppressedCount ?? 0} msgs</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-mono text-xs text-muted-foreground">Density</span>
            <span className="font-mono text-xs text-foreground">{load?.messageDensity ?? 0} words/min</span>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Live Queue (top 5)</div>
          {(queue?.messages ?? []).slice(0, 5).length === 0 ? (
            <div className="text-xs text-muted-foreground font-mono py-4 text-center">Queue empty</div>
          ) : (
            <div className="space-y-2">
              {(queue?.messages ?? []).slice(0, 5).map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 text-xs">
                  <div className="font-mono text-muted-foreground w-6 shrink-0 text-right">{msg.priority}</div>
                  <div className="w-1 rounded-full shrink-0 mt-0.5 h-3" style={{ backgroundColor: msg.priority >= 80 ? "hsl(0 86% 60%)" : msg.priority >= 50 ? "hsl(38 95% 55%)" : "hsl(187 100% 50%)" }} />
                  <div className="font-mono text-foreground truncate flex-1">{msg.text}</div>
                  <InterruptBadge level={msg.interruptibility} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-4">
        <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Observatory — Recent Events</div>
        <div className="space-y-1.5">
          {(log?.entries ?? []).map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 text-xs font-mono">
              <span className="text-muted-foreground shrink-0 w-20 truncate">
                {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <LogTypeBadge type={entry.type} />
              <span className="text-foreground truncate flex-1">{entry.message}</span>
              {entry.priority != null && <span className="text-muted-foreground shrink-0">P:{entry.priority}</span>}
            </div>
          ))}
          {(log?.entries ?? []).length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">No events logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
