import { useState } from "react";
import { useGenerateGuidanceMessage } from "@workspace/api-client-react";

const DIRECTIONS = ["forward", "left", "right", "stop", "slow-down", "reassess", "back"];
const URGENCIES = ["low", "moderate", "high", "immediate"];

function PriorityBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-destructive glow-critical" : value >= 60 ? "bg-warning glow-warning" : value >= 40 ? "bg-info glow-info" : "bg-chart-2";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs text-foreground w-8 text-right">{value}</span>
    </div>
  );
}

function InterruptBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "non-interruptible": "text-muted-foreground border-border",
    important: "text-info border-info bg-info",
    urgent: "text-warning border-warning bg-warning",
    critical: "text-critical border-critical bg-critical glow-critical",
  };
  return <span className={`font-mono text-xs px-2 py-0.5 rounded border ${colors[level] ?? ""}`}>{level.toUpperCase()}</span>;
}

export default function Guidance() {
  const generate = useGenerateGuidanceMessage();
  const [form, setForm] = useState({
    direction: "forward",
    urgency: "moderate",
    context: "",
    distanceMeters: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate.mutate({
      data: {
        direction: form.direction as never,
        urgency: form.urgency as never,
        context: form.context || null,
        distanceMeters: form.distanceMeters ? parseFloat(form.distanceMeters) : null,
      },
    });
  };

  const msg = generate.data;
  const dirIcons: Record<string, string> = {
    forward: "↑", left: "←", right: "→", stop: "⬛", "slow-down": "▽", reassess: "↻", back: "↓"
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">GUIDANCE COMMUNICATOR</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Generate navigation guidance with progressive urgency support</p>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-2">
        {DIRECTIONS.map((dir) => (
          <button
            key={dir}
            onClick={() => setForm({ ...form, direction: dir })}
            className={`p-3 rounded-lg border font-mono text-xs transition-all flex flex-col items-center gap-1.5 ${
              form.direction === dir
                ? "border-info bg-info/10 text-info"
                : "border-border bg-card text-muted-foreground hover:border-info/50 hover:text-foreground"
            }`}
            data-testid={`button-dir-${dir}`}
          >
            <span className="text-lg">{dirIcons[dir]}</span>
            <span className="uppercase text-[10px]">{dir}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="font-mono text-xs text-muted-foreground mb-4 uppercase tracking-wider">Guidance Parameters</div>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-guidance">
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">Urgency Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {URGENCIES.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setForm({ ...form, urgency: u })}
                    className={`py-1.5 rounded border font-mono text-xs transition-all ${
                      form.urgency === u
                        ? u === "immediate" ? "border-critical bg-critical/20 text-critical"
                          : u === "high" ? "border-warning bg-warning/20 text-warning"
                          : u === "moderate" ? "border-info bg-info/20 text-info"
                          : "border-safe bg-safe/20 text-safe"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                    data-testid={`button-urgency-${u}`}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">Distance (m) — optional</label>
              <input
                type="number" step="0.5" min="0" max="50"
                value={form.distanceMeters}
                onChange={(e) => setForm({ ...form, distanceMeters: e.target.value })}
                placeholder="e.g. 3.5"
                className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                data-testid="input-guidance-distance"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">Context — optional</label>
              <input
                type="text"
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
                placeholder="e.g. narrow corridor ahead"
                className="w-full bg-background border border-input rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                data-testid="input-guidance-context"
              />
            </div>
            <button
              type="submit"
              disabled={generate.isPending}
              className="w-full py-2 bg-info/10 border border-info text-info font-mono text-xs rounded hover:bg-info/20 transition-all disabled:opacity-50"
              data-testid="button-generate-guidance"
            >
              {generate.isPending ? "GENERATING..." : "GENERATE GUIDANCE MESSAGE"}
            </button>
          </form>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="font-mono text-xs text-muted-foreground mb-4 uppercase tracking-wider">Generated Message</div>
          {!msg ? (
            <div className="text-xs text-muted-foreground font-mono text-center py-12">Select direction and urgency, then generate</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-background border border-info/40 rounded-lg p-4 glow-info">
                <div className="font-mono text-sm font-bold text-foreground leading-relaxed">{msg.text}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Priority</span>
                  <div className="w-48"><PriorityBar value={msg.priority} /></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Interruptibility</span>
                  <InterruptBadge level={msg.interruptibility} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Verbosity</span>
                  <span className="font-mono text-xs text-foreground uppercase">{msg.verbosityLevel}</span>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="font-mono text-xs text-muted-foreground mb-1">Reasoning</div>
                <div className="font-mono text-xs text-foreground leading-relaxed">{msg.reasoning}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
