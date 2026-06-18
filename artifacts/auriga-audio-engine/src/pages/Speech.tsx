import { useState } from "react";
import { useSynthesizeSpeech, useCompressSpeech } from "@workspace/api-client-react";

const SEVERITIES = ["", "low", "moderate", "high", "critical"];
const VERBOSITIES = ["short", "normal", "verbose", "expert"];
const WALKING_SPEEDS = ["stationary", "slow", "normal", "fast"];
const COMPLEXITIES = ["simple", "moderate", "complex", "chaotic"];
const HAZARD_DENSITIES = ["none", "low", "moderate", "high"];

interface Observation {
  type: string;
  description: string;
  distance: string;
  direction: string;
  confidence: string;
  severity: string;
}

const defaultObs = (): Observation => ({
  type: "obstacle", description: "", distance: "", direction: "", confidence: "0.85", severity: ""
});

export default function Speech() {
  const synthesize = useSynthesizeSpeech();
  const compress = useCompressSpeech();
  const [observations, setObservations] = useState<Observation[]>([defaultObs()]);
  const [context, setContext] = useState({ walkingSpeed: "normal", environmentComplexity: "moderate", hazardDensity: "low", userPreference: "normal" });

  const addObs = () => setObservations([...observations, defaultObs()]);
  const removeObs = (i: number) => setObservations(observations.filter((_, idx) => idx !== i));
  const updateObs = (i: number, field: keyof Observation, value: string) => {
    const updated = [...observations];
    updated[i] = { ...updated[i], [field]: value };
    setObservations(updated);
  };

  const buildObservations = () => observations.map((o) => ({
    type: o.type,
    description: o.description || o.type,
    distance: o.distance ? parseFloat(o.distance) : null,
    direction: o.direction || null,
    confidence: parseFloat(o.confidence),
    severity: (o.severity as never) || null,
  }));

  const handleSynthesize = (e: React.FormEvent) => {
    e.preventDefault();
    synthesize.mutate({ data: { observations: buildObservations() as never, context: context as never } });
  };

  const handleCompress = () => {
    compress.mutate({ data: { observations: buildObservations() as never, maxWords: 10 } });
  };

  const msg = synthesize.data;
  const compressed = compress.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">SPEECH ENGINE</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Generate natural audio messages from environment observations</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Environment Observations</div>
            <form onSubmit={handleSynthesize} className="space-y-3" data-testid="form-synthesize">
              {observations.map((obs, i) => (
                <div key={i} className="bg-background border border-border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-info">OBS {String(i + 1).padStart(2, "0")}</span>
                    {observations.length > 1 && (
                      <button type="button" onClick={() => removeObs(i)} className="font-mono text-xs text-critical hover:text-destructive" data-testid={`button-remove-obs-${i}`}>REMOVE</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-xs text-muted-foreground block mb-0.5">Type</label>
                      <input value={obs.type} onChange={(e) => updateObs(i, "type", e.target.value)} className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid={`input-obs-type-${i}`} />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-muted-foreground block mb-0.5">Description</label>
                      <input value={obs.description} onChange={(e) => updateObs(i, "description", e.target.value)} placeholder="e.g. chair on left" className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" data-testid={`input-obs-description-${i}`} />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-muted-foreground block mb-0.5">Distance (m)</label>
                      <input type="number" step="0.1" value={obs.distance} onChange={(e) => updateObs(i, "distance", e.target.value)} placeholder="optional" className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" data-testid={`input-obs-distance-${i}`} />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-muted-foreground block mb-0.5">Direction</label>
                      <input value={obs.direction} onChange={(e) => updateObs(i, "direction", e.target.value)} placeholder="ahead / left / right" className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" data-testid={`input-obs-direction-${i}`} />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-muted-foreground block mb-0.5">Confidence</label>
                      <input type="number" step="0.05" min="0" max="1" value={obs.confidence} onChange={(e) => updateObs(i, "confidence", e.target.value)} className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid={`input-obs-confidence-${i}`} />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-muted-foreground block mb-0.5">Severity</label>
                      <select value={obs.severity} onChange={(e) => updateObs(i, "severity", e.target.value)} className="w-full bg-card border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid={`select-obs-severity-${i}`}>
                        {SEVERITIES.map((s) => <option key={s} value={s}>{s || "— none —"}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addObs} className="w-full py-1.5 border border-dashed border-border text-muted-foreground font-mono text-xs rounded hover:border-info hover:text-info transition-all" data-testid="button-add-observation">
                + ADD OBSERVATION
              </button>

              <div className="border-t border-border pt-3">
                <div className="font-mono text-xs text-muted-foreground mb-2 uppercase tracking-wider">Environment Context</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-mono text-xs text-muted-foreground block mb-0.5">Walking Speed</label>
                    <select value={context.walkingSpeed} onChange={(e) => setContext({ ...context, walkingSpeed: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-walking-speed">
                      {WALKING_SPEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground block mb-0.5">Complexity</label>
                    <select value={context.environmentComplexity} onChange={(e) => setContext({ ...context, environmentComplexity: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-complexity">
                      {COMPLEXITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground block mb-0.5">Hazard Density</label>
                    <select value={context.hazardDensity} onChange={(e) => setContext({ ...context, hazardDensity: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-hazard-density">
                      {HAZARD_DENSITIES.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted-foreground block mb-0.5">Verbosity Pref.</label>
                    <select value={context.userPreference} onChange={(e) => setContext({ ...context, userPreference: e.target.value })} className="w-full bg-background border border-input rounded px-2 py-1 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" data-testid="select-verbosity">
                      {VERBOSITIES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={synthesize.isPending} className="flex-1 py-2 bg-info/10 border border-info text-info font-mono text-xs rounded hover:bg-info/20 transition-all disabled:opacity-50" data-testid="button-synthesize">
                  {synthesize.isPending ? "SYNTHESIZING..." : "SYNTHESIZE SPEECH"}
                </button>
                <button type="button" onClick={handleCompress} disabled={compress.isPending} className="flex-1 py-2 bg-muted border border-border text-muted-foreground font-mono text-xs rounded hover:border-info hover:text-info transition-all disabled:opacity-50" data-testid="button-compress">
                  {compress.isPending ? "COMPRESSING..." : "COMPRESS"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          {msg && (
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Synthesized Message</div>
              <div className="bg-background border border-info/40 rounded p-3 glow-info mb-3">
                <div className="font-mono text-sm font-bold text-foreground">{msg.text}</div>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span className="text-foreground">{msg.priority}/100</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className="text-foreground">{Math.round(msg.confidence * 100)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-info uppercase">{msg.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Verbosity</span><span className="text-foreground uppercase">{msg.verbosityLevel}</span></div>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="font-mono text-xs text-muted-foreground mb-1">Reasoning</div>
                <div className="font-mono text-xs text-foreground leading-relaxed">{msg.reasoning}</div>
              </div>
            </div>
          )}
          {compressed && (
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Compression Result</div>
              <div className="bg-background border border-safe/40 rounded p-3 glow-safe mb-3">
                <div className="font-mono text-sm font-bold text-foreground">{compressed.compressed}</div>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Word Count</span><span className="text-foreground">{compressed.wordCount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Compression Ratio</span><span className="text-foreground">{compressed.compressionRatio}x</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Safety Preserved</span><span className={compressed.safetyPreserved ? "text-safe" : "text-critical"}>{compressed.safetyPreserved ? "YES" : "NO"}</span></div>
              </div>
              {compressed.droppedItems.length > 0 && (
                <div className="border-t border-border pt-2 mt-2">
                  <div className="font-mono text-xs text-muted-foreground mb-1">Dropped Items</div>
                  {compressed.droppedItems.map((d, i) => (
                    <div key={i} className="font-mono text-xs text-warning">{d}</div>
                  ))}
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="font-mono text-xs text-muted-foreground mb-1">Originals</div>
                {compressed.original.map((o, i) => <div key={i} className="font-mono text-xs text-muted-foreground">{o}</div>)}
              </div>
            </div>
          )}
          {!msg && !compressed && (
            <div className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-center h-48">
              <div className="font-mono text-xs text-muted-foreground text-center">Add observations and synthesize or compress</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
