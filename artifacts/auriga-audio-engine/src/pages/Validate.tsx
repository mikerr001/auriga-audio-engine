import { useState } from "react";
import { useRunValidation } from "@workspace/api-client-react";

const PROCEDURES = [
  { id: "clarity", name: "Clarity", description: "Message comprehension on first hearing — no replay", category: "speech", checkCount: 5 },
  { id: "understandability", name: "Understandability", description: "Semantic understanding, not just hearing accuracy", category: "semantic", checkCount: 5 },
  { id: "reaction-speed", name: "Reaction Speed", description: "Time-to-action from message onset to physical response", category: "timing", checkCount: 4 },
  { id: "cognitive-load", name: "Cognitive Load", description: "Mental burden under concurrent message streams", category: "cognitive", checkCount: 4 },
  { id: "user-trust", name: "User Trust", description: "Calibration of user trust in system confidence claims", category: "trust", checkCount: 4 },
  { id: "information-retention", name: "Info Retention", description: "Message recall after 15s, 60s, and 5 minutes", category: "memory", checkCount: 3 },
];

function PriorityBadge({ p }: { p: string }) {
  const cfg: Record<string, string> = {
    required: "text-critical border-critical bg-critical/10",
    recommended: "text-warning border-warning bg-warning/10",
    optional: "text-muted-foreground border-border",
  };
  return <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${cfg[p] ?? ""}`}>{p.toUpperCase()}</span>;
}

export default function Validate() {
  const runValidation = useRunValidation();
  const [selectedProc, setSelectedProc] = useState("clarity");

  const handleRun = () => {
    runValidation.mutate({ data: { procedure: selectedProc as never } });
  };

  const result = runValidation.data;
  const proc = PROCEDURES.find((p) => p.id === selectedProc);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">HUMAN VALIDATION</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Structured procedures and checklists for clinical validation of assistive audio output</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PROCEDURES.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProc(p.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              selectedProc === p.id ? "border-info bg-info/10" : "border-border bg-card hover:border-border/80"
            }`}
            data-testid={`button-proc-${p.id}`}
          >
            <div className="font-mono text-xs font-bold text-foreground mb-1">{p.name}</div>
            <div className="font-mono text-[10px] text-muted-foreground mb-2">{p.description}</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{p.checkCount} checks</span>
              <span className="font-mono text-[10px] text-muted-foreground">·</span>
              <span className="font-mono text-[10px] text-info uppercase">{p.category}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-card border border-card-border rounded-lg px-4 py-3">
        <div className="flex-1">
          <span className="font-mono text-xs text-muted-foreground">Procedure: </span>
          <span className="font-mono text-xs text-foreground font-bold">{proc?.name ?? selectedProc}</span>
        </div>
        <button
          onClick={handleRun}
          disabled={runValidation.isPending}
          className="px-6 py-2 font-mono text-xs border border-info text-info bg-info/10 hover:bg-info/20 rounded transition-all disabled:opacity-50"
          data-testid="button-run-validation"
        >
          {runValidation.isPending ? "RUNNING..." : "RUN VALIDATION"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="font-mono text-xs text-muted-foreground">
            Procedure: <span className="text-info">{result.procedure}</span>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">
              Checklist — {result.checklist.length} checks
            </div>
            <div className="space-y-3">
              {result.checklist.map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="font-mono text-xs text-info shrink-0">{item.id}</span>
                    <PriorityBadge p={item.priority} />
                    <div className="font-mono text-xs text-foreground">{item.description}</div>
                  </div>
                  <div className="pl-14 space-y-1">
                    <div className="font-mono text-[10px] text-muted-foreground">
                      <span className="text-info uppercase text-[9px] tracking-wider">Method: </span>
                      {item.method}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      <span className="text-safe uppercase text-[9px] tracking-wider">Acceptance: </span>
                      {item.acceptanceCriteria}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Simulation Tools</div>
              {result.simulationTools.map((tool, i) => (
                <div key={i} className="font-mono text-xs text-foreground mb-1.5 last:mb-0">
                  <span className="text-info">◦ </span>{tool}
                </div>
              ))}
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Replay System</div>
              <div className="font-mono text-xs text-foreground leading-relaxed">{result.replaySystem}</div>
            </div>
          </div>

          {result.notes && (
            <div className="bg-warning/5 border border-warning/30 rounded-lg p-4">
              <div className="font-mono text-xs text-warning mb-1 uppercase tracking-wider">⚠ Research Notes</div>
              <div className="font-mono text-xs text-foreground leading-relaxed">{result.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
