import type { ValidationCheckItem } from "./types.js";

const PROCEDURES: Record<string, {
  checklist: ValidationCheckItem[];
  simulationTools: string[];
  replaySystem: string;
  notes: string;
}> = {
  clarity: {
    checklist: [
      {
        id: "CL-01",
        description: "Every spoken message is immediately understood on first hearing, without replay",
        method: "Play each message once to 5 blindfolded participants. Ask them to repeat back what they heard. Score understanding accuracy.",
        acceptanceCriteria: "≥90% of participants correctly identify the hazard type, direction, and urgency on first hearing",
        priority: "required",
      },
      {
        id: "CL-02",
        description: "Uncertainty language ('Possible', 'Uncertain') does not cause hesitation or confusion",
        method: "Present uncertainty-prefixed messages to participants. Measure reaction time vs. certain messages. Conduct post-session interview.",
        acceptanceCriteria: "Reaction time difference <500ms. No participant expresses confusion about what 'Possible' means in this context.",
        priority: "required",
      },
      {
        id: "CL-03",
        description: "Direction words (left, right, slightly-left) are interpreted correctly",
        method: "Play direction messages in a controlled environment. Observe which way participants turn. Record accuracy by direction type.",
        acceptanceCriteria: "≥95% correct direction on 'left', 'right', 'ahead'. ≥85% correct on 'slightly-left', 'slightly-right'.",
        priority: "required",
      },
      {
        id: "CL-04",
        description: "Distance labels (in 2 meters, very close, immediately) convey urgency correctly",
        method: "Ask participants to estimate how much time they have to react for each distance label. Compare to actual intended distances.",
        acceptanceCriteria: "Participants with 'immediately' label stop within 1 step. Participants with 'in 2 meters' label have time to slow down.",
        priority: "required",
      },
      {
        id: "CL-05",
        description: "Short mode messages are sufficient for expert users to navigate safely",
        method: "Expert users (>3 months of assistive navigation) navigate a test course using only short mode messages.",
        acceptanceCriteria: "Zero collisions. ≥90% successful course completion.",
        priority: "recommended",
      },
    ],
    simulationTools: [
      "message-replay-system: Play individual AudioMessage objects at configurable speech rates",
      "scenario-playback: Run a full scenario with audio and observe outputs sequentially",
      "confidence-sweep: Generate the same message at confidence 0.1 through 1.0 to test prefix language",
    ],
    replaySystem: "POST /api/audio/simulate with scenarioId and observe outputMessages[].text for manual review. Each message can be replayed in isolation by extracting the text field.",
    notes: "Clarity testing should use real TTS synthesis, not text review alone. The text-to-speech rendering of 'Possible obstacle slightly left in 2 meters' may differ significantly from visual impression. Test with the intended TTS engine (e.g., system TTS, ElevenLabs, Google TTS).",
  },

  understandability: {
    checklist: [
      {
        id: "UN-01",
        description: "Novice users understand all message types within the first 10 minutes of exposure",
        method: "New participants are given no training. Present 20 messages across all types. Measure comprehension accuracy over time.",
        acceptanceCriteria: "Comprehension ≥70% for first 5 messages, ≥90% by message 15",
        priority: "required",
      },
      {
        id: "UN-02",
        description: "Hazard type labels ('drop-off', 'surface change') are understood without prior training",
        method: "Present hazard messages with unfamiliar hazard types. Ask participants to describe what they would do.",
        acceptanceCriteria: "≥85% of participants describe a safe response (stop, slow down, avoid) without being told what the hazard means",
        priority: "required",
      },
      {
        id: "UN-03",
        description: "Verbal mode transitions (short to verbose) are noticed and understood",
        method: "Switch verbosity mode mid-session. Ask participants if they noticed a change and what changed.",
        acceptanceCriteria: "≥80% of participants notice the change within 5 messages",
        priority: "recommended",
      },
      {
        id: "UN-04",
        description: "Expert mode metadata ([conf:85%]) does not confuse non-expert users accidentally exposed to it",
        method: "Present expert mode messages to participants who did not select expert mode. Measure confusion rate.",
        acceptanceCriteria: "No safety-relevant action is taken incorrectly due to metadata confusion",
        priority: "required",
      },
    ],
    simulationTools: [
      "verbosity-comparison: Generate the same observation in all 4 verbosity modes side by side",
      "novice-scenario: Run 'normal-corridor' with short then normal then verbose mode for comparison",
    ],
    replaySystem: "Use GET /api/audio/config to set verbosityMode, then POST /api/audio/synthesize with the same observations to compare output across modes.",
    notes: "Understandability is distinct from clarity. Clarity = heard correctly. Understandability = interpreted correctly. A message can be clear but misunderstood ('surface change' may be confused with a floor mat vs. a dangerous surface transition).",
  },

  "reaction-speed": {
    checklist: [
      {
        id: "RS-01",
        description: "Stop commands produce a stop action within 1.5 steps of message delivery",
        method: "Participants walk at normal pace. Play 'Stop immediately.' Measure steps taken from message start to full stop.",
        acceptanceCriteria: "≤1.5 steps on average for 'immediate' urgency. ≤3 steps for 'high' urgency.",
        priority: "required",
      },
      {
        id: "RS-02",
        description: "Critical hazard messages do not cause freezing (opposite of action) due to alarm response",
        method: "Measure rate of freeze response vs. avoidance response for critical messages.",
        acceptanceCriteria: "Freeze response rate ≤5% across all critical message types",
        priority: "required",
      },
      {
        id: "RS-03",
        description: "Direction change messages produce correct turn within 2 steps",
        method: "Participants receive left/right turn messages while walking. Record steps to correct turn initiation.",
        acceptanceCriteria: "≤2 steps to turn initiation for 'high' urgency. ≤4 steps for 'moderate'.",
        priority: "required",
      },
      {
        id: "RS-04",
        description: "Drop-off warning at 0.5m produces stop before edge",
        method: "Controlled test with padded drop-off at 0.5m. Play critical drop-off message. Measure stopping distance.",
        acceptanceCriteria: "100% of participants stop before the edge across 10 trials.",
        priority: "required",
      },
    ],
    simulationTools: [
      "timing-test: Inject a hazard event and measure time-to-message delivery in the engine",
      "latency-profiler: Measure processing time from POST /audio/hazard to response",
    ],
    replaySystem: "POST /api/audio/hazard with varying distances (0.3m, 0.5m, 1m, 2m) and urgency levels. Review generated messages and reasoning fields.",
    notes: "Reaction speed testing requires a physical environment or validated VR simulation. Software-only testing can only measure message generation latency, not human reaction latency. Budget for at least 3 separate physical test sessions.",
  },

  "cognitive-load": {
    checklist: [
      {
        id: "CG-01",
        description: "Message frequency in crowded environments does not produce subjective overload",
        method: "Run 'crowded-space' scenario with participants. After session, administer NASA-TLX workload scale.",
        acceptanceCriteria: "NASA-TLX overall score ≤50 (out of 100) during crowded-space scenario",
        priority: "required",
      },
      {
        id: "CG-02",
        description: "Suppression of non-critical messages during overload is not noticed by users",
        method: "Run 'message-overload' scenario. After session, ask participants if they felt they were missing information.",
        acceptanceCriteria: "≤20% of participants report feeling information was withheld",
        priority: "required",
      },
      {
        id: "CG-03",
        description: "Cognitive load metrics (GET /audio/load) correlate with observed user stress",
        method: "Measure heart rate variability during scenarios. Compare against userBurden metric from API.",
        acceptanceCriteria: "Pearson correlation ≥0.6 between userBurden and HRV stress indicator",
        priority: "recommended",
      },
      {
        id: "CG-04",
        description: "No participant reports cognitive exhaustion after 30 minutes of continuous use",
        method: "Continuous 30-minute navigation session with random environmental inputs. Post-session interview and NASA-TLX.",
        acceptanceCriteria: "NASA-TLX ≤60 at 30 minutes. No participant rates 'frustration' ≥70.",
        priority: "required",
      },
    ],
    simulationTools: [
      "load-sweep: Generate messages at increasing rates (5/min to 30/min) and observe load metrics",
      "overload-scenario: Run 'message-overload' scenario and observe real-time cognitive load API",
    ],
    replaySystem: "Monitor GET /api/audio/load during and after simulation runs. Compare overloadRisk transitions across scenarios.",
    notes: "Cognitive load measurement requires psychophysiological instrumentation for ground truth. API metrics are heuristic proxies. Do not use API metrics as a substitute for user study data in safety certification.",
  },

  "user-trust": {
    checklist: [
      {
        id: "UT-01",
        description: "Users trust uncertainty messages appropriately — not over-trusting 'Possible' as certain, not under-trusting as unreliable",
        method: "Present 'Possible obstacle ahead.' followed by no obstacle, and 'Obstacle ahead.' followed by no obstacle. Measure trust decay differently.",
        acceptanceCriteria: "Users rate 'Possible' messages as appropriately uncertain (calibrated trust). False alarms from 'Possible' messages cause less trust decay than false alarms from certain messages.",
        priority: "required",
      },
      {
        id: "UT-02",
        description: "Users do not override or ignore messages after extended use (trust calibration)",
        method: "Longitudinal study: measure compliance with guidance messages at day 1, week 1, month 1.",
        acceptanceCriteria: "Compliance rate ≥90% maintained at month 1. No statistically significant decline from week 1.",
        priority: "required",
      },
      {
        id: "UT-03",
        description: "Users can identify when the system is uncertain vs. confident without reading metadata",
        method: "Play messages from both high-confidence and low-confidence observations. Ask users to rate how confident they think the system is.",
        acceptanceCriteria: "≥75% of participants correctly classify high vs. low confidence messages based on language alone.",
        priority: "required",
      },
    ],
    simulationTools: [
      "confidence-sweep: Generate messages at confidence 0.1 through 0.9 to test language calibration",
      "false-alarm-sequence: Generate hazard messages followed by clear-path observations to test trust recovery",
    ],
    replaySystem: "POST /api/audio/synthesize with varying confidence values (0.3, 0.5, 0.7, 0.9) and same observation to compare uncertainty language across confidence levels.",
    notes: "Trust calibration is the most safety-critical validation dimension. An overconfident system will cause users to trust false positives. An underconfident system will cause users to ignore true hazards. Neither failure mode is acceptable in a safety-critical accessibility context.",
  },

  "information-retention": {
    checklist: [
      {
        id: "IR-01",
        description: "Users can recall the last 3 messages after a complex navigation sequence",
        method: "After a 10-event simulation, ask participants to describe the last 3 messages they heard.",
        acceptanceCriteria: "≥70% of participants correctly identify hazard type and direction from the last 3 messages",
        priority: "recommended",
      },
      {
        id: "IR-02",
        description: "Critical messages are retained despite subsequent non-critical message stream",
        method: "Play critical drop-off message, then 5 low-priority guidance messages. Ask about the drop-off.",
        acceptanceCriteria: "≥95% of participants recall the critical drop-off message after subsequent messages",
        priority: "required",
      },
      {
        id: "IR-03",
        description: "Compressed messages retain all safety-relevant information",
        method: "Compare participant information recall from original multi-message vs. compressed single-message versions of the same scenario.",
        acceptanceCriteria: "No statistically significant difference in safety-relevant information recall between original and compressed versions",
        priority: "required",
      },
    ],
    simulationTools: [
      "message-replay-system: Display outputMessages in sequence with timestamps for manual review",
      "compression-comparison: POST /audio/compress vs. individual messages for same observation set",
    ],
    replaySystem: "Run a scenario via POST /api/audio/simulate, then review outputMessages array. Use the text and reasoning fields to assess what information is conveyed and what is dropped.",
    notes: "Information retention degrades with message frequency. The cognitive load model attempts to prevent overload, but retention has not been formally modeled. This is a key research debt item.",
  },
};

export function runValidation(
  procedure: string,
  _messageIds?: string[]
): {
  procedure: string;
  checklist: ValidationCheckItem[];
  simulationTools: string[];
  replaySystem: string;
  notes: string;
} {
  const p = PROCEDURES[procedure];
  if (!p) {
    return {
      procedure,
      checklist: [],
      simulationTools: [],
      replaySystem: "No procedure found for this type.",
      notes: `Unknown procedure '${procedure}'. Valid procedures: ${Object.keys(PROCEDURES).join(", ")}`,
    };
  }
  return { procedure, ...p };
}
