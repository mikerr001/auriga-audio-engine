import { useGetAudioConfig, getGetAudioConfigQueryKey, useUpdateAudioConfig } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const VERBOSITY_MODES = ["short", "normal", "verbose", "expert"];
const PERSONALITY_STYLES = ["minimal", "standard", "detailed", "research", "developer"];

export default function Config() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useGetAudioConfig({ query: { queryKey: getGetAudioConfigQueryKey() } });
  const update = useUpdateAudioConfig();
  const [form, setForm] = useState({
    verbosityMode: "normal",
    personalityStyle: "standard",
    speechRate: "1.0",
    confidenceThreshold: "0.6",
    maxMessagesPerMinute: "20",
    enabled: true,
    suppressLowConfidence: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        verbosityMode: config.verbosityMode,
        personalityStyle: config.personalityStyle,
        speechRate: String(config.speechRate),
        confidenceThreshold: String(config.confidenceThreshold),
        maxMessagesPerMinute: String(config.maxMessagesPerMinute),
        enabled: config.enabled,
        suppressLowConfidence: config.suppressLowConfidence,
      });
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({
      data: {
        verbosityMode: form.verbosityMode as never,
        personalityStyle: form.personalityStyle as never,
        speechRate: parseFloat(form.speechRate),
        confidenceThreshold: parseFloat(form.confidenceThreshold),
        maxMessagesPerMinute: parseInt(form.maxMessagesPerMinute),
        enabled: form.enabled,
        suppressLowConfidence: form.suppressLowConfidence,
      },
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetAudioConfigQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  if (isLoading) {
    return <div className="p-6 font-mono text-xs text-muted-foreground">Loading configuration...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-mono text-lg font-bold tracking-wide">CONFIGURATION</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">Engine runtime parameters — adaptive verbosity, personality, and safety thresholds</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-config">
          <div className="bg-card border border-card-border rounded-lg p-4 space-y-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Speech Output</div>

            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-2">Verbosity Mode</label>
              <div className="grid grid-cols-4 gap-1.5">
                {VERBOSITY_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, verbosityMode: m })}
                    className={`py-2 rounded border font-mono text-xs transition-all ${
                      form.verbosityMode === m
                        ? "border-info bg-info/10 text-info"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                    data-testid={`button-verbosity-${m}`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1.5">
                {form.verbosityMode === "short" && "Ultra-compact messages — safety-critical only"}
                {form.verbosityMode === "normal" && "Balanced detail with natural language"}
                {form.verbosityMode === "verbose" && "Full spatial context and uncertainty language"}
                {form.verbosityMode === "expert" && "Technical raw mode with confidence intervals"}
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-2">Personality Style</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PERSONALITY_STYLES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, personalityStyle: p })}
                    className={`py-2 rounded border font-mono text-xs transition-all ${
                      form.personalityStyle === p
                        ? "border-info bg-info/10 text-info"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                    data-testid={`button-personality-${p}`}
                  >
                    {p.slice(0, 4).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Speech Rate (0.5–2.0)</label>
                <input
                  type="range" min="0.5" max="2.0" step="0.1"
                  value={form.speechRate}
                  onChange={(e) => setForm({ ...form, speechRate: e.target.value })}
                  className="w-full accent-info"
                  data-testid="range-speech-rate"
                />
                <div className="font-mono text-xs text-info text-center mt-0.5">{form.speechRate}x</div>
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">Max Msgs/Min</label>
                <input
                  type="range" min="1" max="60" step="1"
                  value={form.maxMessagesPerMinute}
                  onChange={(e) => setForm({ ...form, maxMessagesPerMinute: e.target.value })}
                  className="w-full accent-info"
                  data-testid="range-max-messages"
                />
                <div className="font-mono text-xs text-info text-center mt-0.5">{form.maxMessagesPerMinute}/min</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4 space-y-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Safety Thresholds</div>

            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">
                Confidence Threshold — suppress messages below this
              </label>
              <input
                type="range" min="0" max="1" step="0.05"
                value={form.confidenceThreshold}
                onChange={(e) => setForm({ ...form, confidenceThreshold: e.target.value })}
                className="w-full accent-warning"
                data-testid="range-confidence-threshold"
              />
              <div className="flex justify-between font-mono text-xs mt-0.5">
                <span className="text-muted-foreground">0%</span>
                <span className="text-warning">{Math.round(parseFloat(form.confidenceThreshold) * 100)}%</span>
                <span className="text-muted-foreground">100%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-foreground">Engine Enabled</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">Master on/off switch for audio output</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, enabled: !form.enabled })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.enabled ? "bg-safe" : "bg-muted"}`}
                  data-testid="toggle-engine-enabled"
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.enabled ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-foreground">Suppress Low Confidence</div>
                  <div className="font-mono text-[10px] text-muted-foreground mt-0.5">Drop messages below confidence threshold (critical hazards always pass)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, suppressLowConfidence: !form.suppressLowConfidence })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.suppressLowConfidence ? "bg-info" : "bg-muted"}`}
                  data-testid="toggle-suppress-low-confidence"
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.suppressLowConfidence ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={update.isPending}
            className={`w-full py-2.5 font-mono text-xs rounded border transition-all ${
              saved
                ? "border-safe bg-safe/10 text-safe"
                : "border-info bg-info/10 text-info hover:bg-info/20"
            } disabled:opacity-50`}
            data-testid="button-save-config"
          >
            {update.isPending ? "SAVING..." : saved ? "✓ SAVED" : "SAVE CONFIGURATION"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Current Live Config</div>
            <div className="space-y-2">
              {config && Object.entries(config).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-border pb-1.5 last:border-0 last:pb-0">
                  <span className="font-mono text-xs text-muted-foreground">{k}</span>
                  <span className={`font-mono text-xs ${
                    v === true ? "text-safe" : v === false ? "text-critical" : "text-foreground"
                  } uppercase`}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="font-mono text-xs text-muted-foreground mb-3 uppercase tracking-wider">Constitutional Constraints</div>
            <div className="space-y-2">
              {[
                { label: "Critical hazards always spoken", status: true },
                { label: "Uncertainty always disclosed", status: true },
                { label: "Critical messages never suppressed", status: true },
                { label: "Confidence threshold bypassed for hazards", status: true },
                { label: "Engine disable preserves critical alerts", status: true },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-safe">✓</span>
                  <span className="font-mono text-xs text-foreground">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
