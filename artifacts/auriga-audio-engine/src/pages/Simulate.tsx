import { useState } from "react";
import { useGetSimulationScenarios, getGetSimulationScenariosQueryKey, useRunSimulation } from "@workspace/api-client-react";

function SeverityBadge({ sev }: { sev: string }) {
  const cfg: Record<string, string> = {
    none: "text-safe border-safe", low: "text-info border-info", moderate: "text-info border-info",
    high: "text-warning border-warning", critical: "text-critical border-critical",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${cfg[sev] ?? "text-muted-foreground border-border"}`}>{sev.toUpperCase()}</span>;
}

function InterruptBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    "non-interruptible": "text-muted-foreground border-border",
    important: "text-info border-info bg-info/10",
    urgent: "text-warning border-warning bg-warning/10",
    critical: "text-critical border-critical bg-critical/10",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${cfg[level] ?? ""}`}>{level.replace("non-interruptible","NON-INT").toUpperCase()}</span>;
}

export default function Simulate() {
  const { data: scenariosData } = useGetSimulationScenarios({ query: { queryKey: getGetSimulationScenariosQueryKey() } });
  const runSim = useRunSimulation();
  const [selectedId, setSelectedId] = useState("normal-corridor");
  const scenarios = scenariosData?.scenarios ?? [];

  const handleRun = () => {
    runSim.mutate({ data: { scenarioId: selectedId } });
  };

  const result = runSim.data;
  const selected = scenarios.find((s) => s.id === selectedId);

  const loadColor: Record<string, string> = {
    none: "text-safe", low: "text-safe", moderate: "text-info", high: "text-warning", critical: "text-critical"
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">SCENARIO SIMULATOR</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Run adversarial and normal scenarios through the audio engine — tests constitutional constraints</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              selectedId === s.id
                ? s.adversarial ? "border-critical bg-critical/10" : "border-info bg-info/10"
                : "border-border bg-card hover:border-border/80"
            }`}
            data-testid={`button-scenario-${s.id}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-bold text-foreground">{s.name}</span>
              {s.adversarial && <span className="font-mono text-[10px] text-critical border border-critical px-1 rounded">ADV</span>}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground leading-relaxed">{s.description}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-1.5">{s.eventCount} events → {s.expectedMessages} expected</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex items-center justify-between bg-card border border-card-border rounded-lg px-4 py-3">
          <div>
            <span className="font-mono text-xs text-muted-foreground">Selected: </span>
            <span className="font-mono text-xs text-foreground font-bold">{selected.name}</span>
            <span className="font-mono text-xs text-muted-foreground ml-3">Category: {selected.category}</span>
          </div>
          <button
            onClick={handleRun}
            disabled={runSim.isPending}
            className={`px-6 py-2 font-mono text-xs rounded border transition-all disabled:opacity-50 ${
              selected.adversarial
                ? "border-critical text-critical bg-critical/10 hover:bg-critical/20"
                : "border-info text-info bg-info/10 hover:bg-info/20"
            }`}
            data-testid="button-run-simulation"
          >
            {runSim.isPending ? "RUNNING..." : "RUN SIMULATION"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Events", value: result.totalEvents, color: "text-foreground" },
              { label: "Spoken", value: result.messagesSpoken, color: "text-safe" },
              { label: "Suppressed", value: result.messagesSuppressed, color: "text-warning" },
              { label: "Priority Conflicts", value: result.priorityConflicts, color: result.priorityConflicts > 0 ? "text-warning" : "text-safe" },
              { label: "Safety Violations", value: result.safetyViolations, color: result.safetyViolations > 0 ? "text-critical" : "text-safe" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-card-border rounded-lg p-3 text-center">
                <div className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted-foreground">Cognitive Load Peak:</span>
            <span className={`font-mono text-xs font-bold uppercase ${loadColor[result.cognitiveLoadPeak] ?? "text-foreground"}`}>{result.cognitiveLoadPeak}</span>
            <span className="font-mono text-xs text-muted-foreground ml-4">Duration: {result.duration}ms</span>
          </div>

          {result.safetyViolations > 0 && (
            <div className="bg-critical/10 border border-critical rounded-lg p-3 glow-critical">
              <div className="font-mono text-xs text-critical font-bold">CONSTITUTIONAL VIOLATION: {result.safetyViolations} safety violation(s) detected</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Weaknesses Identified</div>
              {result.weaknesses.map((w, i) => (
                <div key={i} className="flex gap-2 mb-2 last:mb-0">
                  <span className="text-warning shrink-0 mt-0.5">▸</span>
                  <span className="font-mono text-xs text-foreground leading-relaxed">{w}</span>
                </div>
              ))}
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Research Debt Generated ({result.researchDebt.length})</div>
              {result.researchDebt.map((rd) => (
                <div key={rd.id} className="mb-2 last:mb-0 border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SeverityBadge sev={rd.severity} />
                    <span className="font-mono text-xs text-foreground truncate">{rd.title}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">{rd.category}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Output Messages ({result.outputMessages.length})</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.outputMessages.map((msg, i) => (
                <div key={msg.id} className="flex items-start gap-3 text-xs font-mono border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="text-foreground">{msg.text}</div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">{msg.reasoning}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <InterruptBadge level={msg.interruptibility} />
                    <span className="text-muted-foreground text-[10px]">P:{msg.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="font-mono text-xs text-muted-foreground mb-2 uppercase tracking-wider">Simulation Assumptions</div>
            {result.assumptions.map((a, i) => (
              <div key={i} className="font-mono text-xs text-muted-foreground mb-0.5">◦ {a}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
