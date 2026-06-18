import { Router } from "express";
import {
  SynthesizeSpeechBody,
  CompressSpeechBody,
  PrioritizeMessagesBody,
  EnqueueMessageBody,
  DequeueMessageParams,
  GenerateHazardMessageBody,
  GenerateGuidanceMessageBody,
  UpdateAudioConfigBody,
  GetObservatoryLogQueryParams,
  AddResearchDebtBody,
  GenerateAlertBody,
  RunSimulationBody,
  RunValidationBody,
} from "@workspace/api-zod";
import { synthesizeSpeech } from "../audio/speech.js";
import { compressSpeech } from "../audio/compression.js";
import { prioritizeMessages } from "../audio/priority.js";
import { getQueueState, enqueue, dequeue, clearQueue } from "../audio/queue.js";
import { generateHazardMessage } from "../audio/hazard.js";
import { generateGuidanceMessage } from "../audio/guidance.js";
import { getConfig, updateConfig } from "../audio/config.js";
import { getCognitiveLoadMetrics, resetCognitiveLoad } from "../audio/cognitive.js";
import { getLog, logEvent } from "../audio/observatory.js";
import { state } from "../audio/state.js";
import { getVocabulary, getAlertForType } from "../audio/vocabulary.js";
import { getScenarios, runSimulation } from "../audio/simulation.js";
import { runValidation } from "../audio/validation.js";
import { randomUUID } from "crypto";

const router = Router();

router.post("/audio/synthesize", (req, res) => {
  const parsed = SynthesizeSpeechBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { observations, context } = parsed.data;
  const msg = synthesizeSpeech(observations as never, context as never);
  logEvent("spoken", msg.text, { priority: msg.priority, confidence: msg.confidence });
  res.json(msg);
});

router.post("/audio/compress", (req, res) => {
  const parsed = CompressSpeechBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { observations, maxWords } = parsed.data;
  const result = compressSpeech(observations as never, maxWords ?? 10);
  res.json(result);
});

router.post("/audio/prioritize", (req, res) => {
  const parsed = PrioritizeMessagesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { messages, context } = parsed.data;
  const result = prioritizeMessages(messages as never, context as never);
  res.json(result);
});

router.get("/audio/queue", (_req, res) => {
  res.json(getQueueState());
});

router.post("/audio/queue", (req, res) => {
  const parsed = EnqueueMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const result = enqueue(parsed.data as never);
  res.json(result);
});

router.post("/audio/queue/clear", (_req, res) => {
  const result = clearQueue();
  res.json(result);
});

router.delete("/audio/queue/:messageId", (req, res) => {
  const parsed = DequeueMessageParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const result = dequeue(parsed.data.messageId);
  res.json(result);
});

router.post("/audio/hazard", (req, res) => {
  const parsed = GenerateHazardMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const msg = generateHazardMessage(parsed.data as never);
  res.json(msg);
});

router.post("/audio/guidance", (req, res) => {
  const parsed = GenerateGuidanceMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const msg = generateGuidanceMessage(parsed.data as never);
  res.json(msg);
});

router.get("/audio/config", (_req, res) => {
  res.json(getConfig());
});

router.put("/audio/config", (req, res) => {
  const parsed = UpdateAudioConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const updated = updateConfig(parsed.data as never);
  res.json(updated);
});

router.get("/audio/load", (_req, res) => {
  const recentMessages = [...state.queue].slice(0, 10);
  const metrics = getCognitiveLoadMetrics(recentMessages as never);
  res.json(metrics);
});

router.post("/audio/load/reset", (_req, res) => {
  resetCognitiveLoad();
  res.json({ success: true, message: "Cognitive load tracker reset" });
});

router.get("/audio/log", (req, res) => {
  const parsed = GetObservatoryLogQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const type = parsed.success ? (parsed.data.type ?? undefined) : undefined;
  const result = getLog(limit, type);
  res.json(result);
});

router.get("/audio/research-debt", (_req, res) => {
  const criticalCount = state.researchDebt.filter((e) => e.severity === "critical").length;
  res.json({
    entries: state.researchDebt,
    totalCount: state.researchDebt.length,
    criticalCount,
  });
});

router.post("/audio/research-debt", (req, res) => {
  const parsed = AddResearchDebtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const entry = {
    ...parsed.data,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    assumptions: parsed.data.assumptions ?? [],
    failureModes: parsed.data.failureModes ?? [],
  } as never;
  state.researchDebt.push(entry);
  res.json(entry);
});

router.get("/audio/vocabulary", (_req, res) => {
  res.json(getVocabulary());
});

router.post("/audio/alert", (req, res) => {
  const parsed = GenerateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const alert = getAlertForType(parsed.data.alertType as never, parsed.data.context ?? null);
  res.json(alert);
});

router.get("/audio/scenarios", (_req, res) => {
  res.json({ scenarios: getScenarios() });
});

router.post("/audio/simulate", (req, res) => {
  const parsed = RunSimulationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { scenarioId, customEvents, configOverride } = parsed.data;
  const result = runSimulation(
    scenarioId ?? null,
    (customEvents as never) ?? null,
    (configOverride as never) ?? null
  );
  res.json(result);
});

router.post("/audio/validate", (req, res) => {
  const parsed = RunValidationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const result = runValidation(parsed.data.procedure, parsed.data.messageIds ?? []);
  res.json(result);
});

export default router;
