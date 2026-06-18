import { useState } from "react";
import { usePrioritizeMessages } from "@workspace/api-client-react";

const MSG_TYPES = ["hazard", "guidance", "status", "confidence", "alert", "system"];
const SEVERITIES = ["", "low", "moderate", "high", "critical"];

interface Candidate {
  id: string;
  text: string;
  type: string;
  confidence: string;
  severity: string;
}

let ctr = 0;
const nextId = () => `msg-${++ctr}`;

function InterruptBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    "non-interruptible": "text-muted-foreground border-border",
    important: "text-info border-info bg-info/10",
    urgent: "text-warning border-warning bg-warning/10",
    critical: "text-critical border-critical bg-critical/10",
  };
  return <span className={`font-mono text-xs px-2 py-0.5 rounded border ${cfg[level] ?? ""}`}>{level.replace("non-interruptible","NON-INT").toUpperCase()}</span>;
}

export default function Prioritize() {
  const prioritize = usePrioritizeMessages();
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: nextId(), text: "Drop-off ahead immediately.", type: "hazard", confidence: "0.97", severity: "critical" },
    { id: nextId(), text: "Possible obstacle slightly left.", type: "hazard", confidence: "0.55", severity: "moderate" },
    { id: nextId(), text: "Continue forward.", type: "guidance", confidence: "1.0", severity: "" },
  ]);

  const addCandidate = () => setCandidates([...candidates, { id: nextId(), text: "", type: "hazard", confidence: "0.8", severity: "" }]);
  const removeCandidate = (id: string) => setCandidates(candidates.filter((c) => c.id !== id));
  const updateCandidate = (id: string, field: keyof Candidate, value: string) => {
    setCandidates(candidates.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    prioritize.mutate({
      data: {
        messages: candidates.map((c) => ({
          id: c.id,
          text: c.text || "—",
          type: c.type as never,
          confidence: parseFloat(c.confidence),
          severity: (c.severity as never) || null,
        })),
      },
    });
  };

  const result = prioritize.data;

  const loadImpactColor: Record<string, string> = {
    minimal: "text-safe", moderate: "text-info", high: "text-warning", critical: "text-critical"
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">PRIORITY ENGINE</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Score and rank candidate messages — generates reasoning and interruptibility levels</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Candidate Messages</div>
          <form onSubmit={handleSubmit} className="space-y-3" data-testid="form-prioritize">
            {candidates.map((c) => (
              <div key={c.id} className="bg-background border border-border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-info">{c.id.toUpperCase()}</span>
                  <button type="button" onClick={() => removeCandidate(c.id)} className="font-mono text-xs text-critical" data-testid={`button-remove-candidate-${c.id}`}>REMOVE</button>
                </div>
                <input
                  value={c.text}
                  onChange={(e) => updateCandidate(c.id, "text", e.target.value)}
                  placeholder="Message text"
                  className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  data-testid={`input-candidate-text-${c.id}`}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select value={c.type} onChange={(e) => updateCandidate(c.id, "type", e.target.value)} className="bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid={`select-candidate-type-${c.id}`}>
                    {MSG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={c.severity} onChange={(e) => updateCandidate(c.id, "severity", e.target.value)} className="bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid={`select-candidate-severity-${c.id}`}>
                    {SEVERITIES.map((s) => <option key={s} value={s}>{s || "— sev —"}</option>)}
                  </select>
                  <input type="number" step="0.05" min="0" max="1" value={c.confidence} onChange={(e) => updateCandidate(c.id, "confidence", e.target.value)} placeholder="conf" className="bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid={`input-candidate-confidence-${c.id}`} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addCandidate} className="w-full py-1.5 border border-dashed border-border text-muted-foreground font-mono text-xs rounded hover:border-info hover:text-info transition-all" data-testid="button-add-candidate">
              + ADD CANDIDATE
            </button>
            <button type="submit" disabled={prioritize.isPending} className="w-full py-2 bg-info/10 border border-info text-info font-mono text-xs rounded hover:bg-info/20 transition-all disabled:opacity-50" data-testid="button-prioritize">
              {prioritize.isPending ? "SCORING..." : "PRIORITIZE MESSAGES"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">Cognitive Load Impact</span>
                <span className={`font-mono text-xs font-bold uppercase ${loadImpactColor[result.cognitiveLoadImpact] ?? "text-foreground"}`}>{result.cognitiveLoadImpact}</span>
              </div>
              <div className="bg-card border border-card-border rounded-lg p-4">
                <div className="font-mono text-xs text-safe mb-3 uppercase tracking-wider">Ranked ({result.ranked.length})</div>
                <div className="space-y-3">
                  {result.ranked.map((s, i) => (
                    <div key={s.message.id} className="border border-border rounded p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground w-4">#{i + 1}</span>
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${s.score >= 80 ? "bg-destructive" : s.score >= 60 ? "bg-warning" : "bg-info"}`} style={{ width: `${s.score}%` }} />
                        </div>
                        <span className="font-mono text-xs text-foreground w-8 text-right">{s.score}</span>
                        <InterruptBadge level={s.interruptibility} />
                        {s.willInterrupt && <span className="font-mono text-xs text-warning">INTERRUPTS</span>}
                      </div>
                      <div className="font-mono text-xs text-foreground">{s.message.text}</div>
                      <div className="font-mono text-xs text-muted-foreground leading-relaxed">{s.reasoning}</div>
                    </div>
                  ))}
                </div>
              </div>
              {result.suppressed.length > 0 && (
                <div className="bg-card border border-card-border rounded-lg p-4">
                  <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Suppressed ({result.suppressed.length})</div>
                  <div className="space-y-2">
                    {result.suppressed.map((s) => (
                      <div key={s.message.id} className="border border-border rounded p-2.5">
                        <div className="font-mono text-xs text-muted-foreground line-through">{s.message.text}</div>
                        <div className="font-mono text-xs text-warning/70 mt-1 text-[10px]">{s.reasoning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-center h-48">
              <div className="font-mono text-xs text-muted-foreground text-center">Add candidates and run the priority engine</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
