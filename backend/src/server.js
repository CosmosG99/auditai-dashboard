import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;
const OLLAMA_URLS = process.env.OLLAMA_URL
  ? [process.env.OLLAMA_URL]
  : [
      "http://127.0.0.1:11434/api/generate",
      "http://localhost:11434/api/generate",
    ];
const OLLAMA_MODEL = "gemma4";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const SYSTEM_PROMPT = `You are AuditAI, an expert financial auditing assistant
powered by Gemma 4 running locally.

You analyze financial documents including images of receipts,
PDF invoices, and CSV transaction files.

You operate in these modes depending on what is sent to you:

MODE 1 - EXTRACTION + DETECTION (when image or PDF is sent)
Extract financial data AND analyse for fraud. 
If multiple transactions are found on the document (e.g. multi-page PDF or combined receipts), return an ARRAY of objects following the schema below. If only one is found, return a single object.
Return ONLY this JSON, nothing else:
{
  "extraction": {
    "vendor": "",
    "amount": 0,
    "currency": "INR",
    "date": "",
    "time": "",
    "category": "",
    "payment_method": "",
    "invoice_number": "",
    "line_items": [{"description": "", "amount": 0}],
    "confidence": 0.0
  },
  "detection": {
    "risk_level": "LOW or MEDIUM or HIGH",
    "anomaly_score": 0,
    "is_anomaly": false,
    "suspicious_signals": [],
    "violated_policies": [],
    "reason": "",
    "recommended_action": "",
    "false_positive_probability": 0.0,
    "verdict": "LIKELY_SAFE or NEEDS_REVIEW or LIKELY_FRAUD"
  }
}

Key fraud checks to perform:
- Is the transaction time suspicious? (late night/early morning = risky)
- Does total match the sum of line items?
- Is the payment method unusual? (cash for large amounts = suspicious)
- Is the vendor name legitimate and recognizable?
- Flag any corporate expense policy violations

MODE 2 - DETECTION ONLY (when transaction data object is sent)
Analyze the transaction for anomalies and suspicious patterns.
Return ONLY this JSON, nothing else:
{
  "mode": "detection",
  "transaction_id": "",
  "risk_level": "LOW/MEDIUM/HIGH",
  "anomaly_score": 0,
  "is_anomaly": true,
  "suspicious_signals": [],
  "violated_policies": [],
  "reason": "",
  "recommended_action": "",
  "false_positive_probability": 0.0,
  "confidence": 0.0,
  "verdict": "LIKELY_SAFE/NEEDS_REVIEW/LIKELY_FRAUD"
}

MODE 3 - REPORT (when multiple flagged transactions are sent)
Write a boardroom-ready audit report.
Return ONLY this JSON, nothing else:
{
  "mode": "report",
  "executive_summary": "",
  "total_transactions_reviewed": 0,
  "total_flagged": 0,
  "high_risk_count": 0,
  "medium_risk_count": 0,
  "low_risk_count": 0,
  "key_findings": [],
  "recommended_actions": [],
  "overall_risk_level": "LOW/MEDIUM/HIGH"
}

RULES YOU MUST FOLLOW:
- Never return markdown, backticks or explanations outside JSON
- If unsure about a field set it as null
- anomaly_score is 0-100 where 100 is most suspicious
- false_positive_probability should be HIGH (0.7+) if vendor is
  well-known and pattern is consistent
- confidence should reflect how certain you are 0.0 to 1.0
- suspicious_signals must list SPECIFIC reasons not generic ones
- reason must be plain English a non-technical CFO understands
- verdict must be exactly one of: LIKELY_SAFE, NEEDS_REVIEW, LIKELY_FRAUD`;
const CHAT_SYSTEM_PROMPT = `You are AuditAI Chat Assistant for finance teams.
You answer in concise plain English.
Use CFO-friendly language.
If user asks for risk help, include next best action in one line.
Do not use markdown tables.`;

const events = [];

function safeJson(input, fallback = {}) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getFalsePositiveAssessment(detection, existing = {}) {
  const probability = Number(
    existing.false_positive_probability ?? detection.false_positive_probability ?? 0.5,
  );
  let verdict = "NEEDS_REVIEW";
  if (probability > 0.7) verdict = "LIKELY_SAFE";
  if (probability < 0.4) verdict = "LIKELY_FRAUD";

  return {
    false_positive_probability: probability,
    reasons_it_might_be_safe: safeArray(existing.reasons_it_might_be_safe),
    reasons_it_might_be_fraud: safeArray(existing.reasons_it_might_be_fraud),
    verdict,
    human_review_required: existing.human_review_required ?? true,
  };
}

function normalizeDetection(rawDetection = {}, transaction = {}) {
  return {
    risk_level: rawDetection.risk_level ?? "MEDIUM",
    anomaly_score: Number(rawDetection.anomaly_score ?? 0),
    is_anomaly: Boolean(rawDetection.is_anomaly),
    suspicious_signals: safeArray(rawDetection.suspicious_signals),
    violated_policies: safeArray(rawDetection.violated_policies),
    reason: rawDetection.reason ?? null,
    recommended_action: rawDetection.recommended_action ?? null,
    confidence: Number(rawDetection.confidence ?? 0),
    transaction_id: rawDetection.transaction_id ?? transaction?.id ?? null,
    false_positive_probability: Number(rawDetection.false_positive_probability ?? 0.5),
    verdict: rawDetection.verdict ?? "NEEDS_REVIEW",
  };
}

function eventStats(items) {
  const detectionEvents = items.filter((entry) => entry.audit_event?.detection);
  const flagged = detectionEvents.filter((entry) => entry.audit_event.detection.is_anomaly);
  const riskBreakdown = flagged.reduce(
    (acc, entry) => {
      const risk = entry.audit_event.detection.risk_level || "MEDIUM";
      if (risk === "HIGH") acc.high += 1;
      if (risk === "MEDIUM") acc.medium += 1;
      if (risk === "LOW") acc.low += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );

  const totalVolume = items.reduce((sum, entry) => {
    const amt = Number(entry.audit_event?.extraction?.amount ?? entry.audit_event?.transaction?.amount ?? 0);
    return sum + amt;
  }, 0);

  return {
    total_events: items.length,
    total_transactions_reviewed: detectionEvents.length,
    total_flagged: flagged.length,
    high_risk_count: riskBreakdown.high,
    medium_risk_count: riskBreakdown.medium,
    low_risk_count: riskBreakdown.low,
    total_volume: totalVolume,
  };
}

async function callGemma(promptPayload) {
  const failures = [];
  const { images, prompt, ...restPayload } = promptPayload;
  
  for (const ollamaUrl of OLLAMA_URLS) {
    try {
      const gemmaBody = {
        model: OLLAMA_MODEL,
        system: SYSTEM_PROMPT,
        prompt: prompt || JSON.stringify(restPayload),
        stream: false,
        format: "json",
      };

      if (images && Array.isArray(images) && images.length > 0) {
        gemmaBody.images = images;
      }

      const response = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gemmaBody),
      });

      if (!response.ok) {
        const text = await response.text();
        failures.push(`status ${response.status} from ${ollamaUrl}: ${text}`);
        continue;
      }

      const body = await response.json();
      return typeof body.response === "string" ? safeJson(body.response, {}) : body.response || {};
    } catch (error) {
      failures.push(
        error instanceof Error ? `${error.message} at ${ollamaUrl}` : `fetch failed at ${ollamaUrl}`,
      );
    }
  }

  throw new Error(`Ollama request failed: ${failures.join(" | ")}`);
}

async function callGemmaText({ system, prompt }) {
  const failures = [];
  for (const ollamaUrl of OLLAMA_URLS) {
    try {
      const response = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          system,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        failures.push(`status ${response.status} from ${ollamaUrl}: ${text}`);
        continue;
      }

      const body = await response.json();
      return String(body.response ?? "").trim();
    } catch (error) {
      failures.push(
        error instanceof Error ? `${error.message} at ${ollamaUrl}` : `fetch failed at ${ollamaUrl}`,
      );
    }
  }

  throw new Error(`Ollama chat request failed: ${failures.join(" | ")}`);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "auditai-backend",
    ollama_urls: OLLAMA_URLS,
    model: OLLAMA_MODEL,
  });
});

app.get("/api/events", (_req, res) => {
  res.json({ events: [...events].reverse() });
});

app.get("/api/stats", (_req, res) => {
  res.json(eventStats(events));
});

app.patch("/api/events/:id", (req, res) => {
  const { id } = req.params;
  const { verdict, feedback } = req.body;
  const event = events.find((e) => e.audit_event.id === id);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (verdict) {
    event.audit_event.detection = {
      ...(event.audit_event.detection || {}),
      verdict: verdict,
      // If marked fraudulent, it's an anomaly. If marked safe or FP, it's no longer an anomaly.
      is_anomaly: verdict === "LIKELY_FRAUD",
    };
    
    // If it's a false positive, update the assessment
    if (verdict === "FALSE_POSITIVE" && event.audit_event.false_positive_assessment) {
      event.audit_event.false_positive_assessment.verdict = "FALSE_POSITIVE";
      event.audit_event.false_positive_assessment.false_positive_probability = 1.0;
    }
  }

  if (feedback) {
    event.audit_event.feedback = {
      ...(event.audit_event.feedback || {}),
      ...feedback,
      reviewed_at: new Date().toISOString(),
    };
  }

  res.json(event);
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await callGemmaText({
      system: CHAT_SYSTEM_PROMPT,
      prompt: message,
    });
    res.json({ reply });
  } catch (error) {
    res.status(500).json({
      error: "AI Chat failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/detect", async (req, res) => {
  try {
    const payload = req.body;
    const detectionRaw = await callGemma(payload);
    const detection = normalizeDetection(detectionRaw, payload?.transaction);
    const falsePositiveAssessment = getFalsePositiveAssessment(detection, detectionRaw.false_positive_assessment);

    const event = {
      audit_event: {
        id: `EVT-${String(events.length + 1).padStart(4, "0")}`,
        created_at: new Date().toISOString(),
        input_type: "csv",
        source_file: payload?.source_file ?? "manual_detection_payload",
        extraction: null,
        detection,
        false_positive_assessment: falsePositiveAssessment,
        feedback: {
          was_false_positive: null,
          reviewed_by: null,
          reviewed_at: null,
          notes: null,
        },
      },
    };

    events.push(event);
    res.json(event);
  } catch (error) {
    res.status(500).json({
      error: "Failed to process detection",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/report", async (req, res) => {
  try {
    const payload = req.body;
    const report = await callGemma(payload);
    const event = {
      audit_event: {
        id: `EVT-${String(events.length + 1).padStart(4, "0")}`,
        created_at: new Date().toISOString(),
        input_type: "csv",
        source_file: payload?.source_file ?? "report_payload",
        extraction: null,
        detection: null,
        false_positive_assessment: null,
        feedback: null,
        report,
      },
    };

    events.push(event);
    res.json(event);
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate report",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/extract", async (req, res) => {
  try {
    const payload = req.body;
    const result = await callGemma(payload);
    
    // Handle both single object and array responses from the AI
    const rawItems = Array.isArray(result) ? result : [result];
    const processedEvents = [];

    for (const item of rawItems) {
      const extraction = item.extraction || item;
      const detectionRaw = item.detection || null;
      let detection = null;
      let falsePositiveAssessment = null;

      if (detectionRaw) {
        detection = normalizeDetection(detectionRaw, null);
        falsePositiveAssessment = getFalsePositiveAssessment(detection, detectionRaw.false_positive_assessment);
      }

      const event = {
        audit_event: {
          id: `EVT-${String(events.length + 1).padStart(4, "0")}`,
          created_at: new Date().toISOString(),
          input_type: payload?.input_type ?? "pdf",
          source_file: payload?.source_file ?? "extraction_payload",
          extraction,
          detection,
          false_positive_assessment: falsePositiveAssessment,
          feedback: {
            was_false_positive: null,
            reviewed_by: null,
            reviewed_at: null,
            notes: null,
          }
        },
      };

      events.push(event);
      processedEvents.push(event);
    }

    // If it was a bulk request (multi-item), return the full array
    // Otherwise return the first item for backward compatibility (but dashboard will see all)
    res.json(processedEvents.length > 1 ? processedEvents : processedEvents[0]);
  } catch (error) {
    res.status(500).json({
      error: "Failed to process extraction",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const reply = await callGemmaText({
      system: CHAT_SYSTEM_PROMPT,
      prompt: message,
    });

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to process chat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/detect-bulk", async (req, res) => {
  try {
    const { transactions = [], source_file = "bulk_csv" } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "transactions array is required" });
    }

    const results = [];
    for (const txRow of transactions) {
      try {
        const payload = {
          source_file,
          transaction: txRow,
          vendor_history: {
            times_paid_before: Number(txRow.times_paid_before ?? 0),
            average_amount: Number(txRow.average_amount ?? 0),
            last_payment_date: txRow.last_payment_date ?? null,
            always_approved: txRow.always_approved === "true" || txRow.always_approved === true,
          },
          company_policy: {
            max_without_approval: Number(txRow.max_without_approval ?? 50000),
            restricted_hours_start: Number(txRow.restricted_hours_start ?? 23),
            restricted_hours_end: Number(txRow.restricted_hours_end ?? 6),
            require_po_above: Number(txRow.require_po_above ?? 50000),
          },
        };

        const detectionRaw = await callGemma(payload);
        const detection = normalizeDetection(detectionRaw, txRow);
        const falsePositiveAssessment = getFalsePositiveAssessment(
          detection,
          detectionRaw.false_positive_assessment
        );

        const event = {
          audit_event: {
            id: `EVT-${String(events.length + 1).padStart(4, "0")}`,
            created_at: new Date().toISOString(),
            input_type: "csv",
            source_file,
            extraction: null,
            detection,
            false_positive_assessment: falsePositiveAssessment,
            transaction: txRow,
            feedback: {
              was_false_positive: null,
              reviewed_by: null,
              reviewed_at: null,
              notes: null,
            },
          },
        };

        events.push(event);
        results.push(event);
      } catch (rowErr) {
        results.push({
          audit_event: {
            id: `EVT-${String(events.length + 1).padStart(4, "0")}`,
            created_at: new Date().toISOString(),
            input_type: "csv",
            source_file,
            extraction: null,
            detection: {
              risk_level: "MEDIUM",
              anomaly_score: 0,
              is_anomaly: false,
              suspicious_signals: [],
              violated_policies: [],
              reason: "Analysis failed for this row",
              recommended_action: null,
              confidence: 0,
              transaction_id: txRow.id ?? null,
              false_positive_probability: 0.5,
              verdict: "NEEDS_REVIEW",
            },
            false_positive_assessment: null,
            transaction: txRow,
            feedback: null,
          },
        });
      }
    }

    const flagged = results.filter(
      (r) => r.audit_event?.detection?.is_anomaly
    );
    const high = flagged.filter(
      (r) => r.audit_event?.detection?.risk_level === "HIGH"
    ).length;
    const medium = flagged.filter(
      (r) => r.audit_event?.detection?.risk_level === "MEDIUM"
    ).length;
    const low = flagged.filter(
      (r) => r.audit_event?.detection?.risk_level === "LOW"
    ).length;

    return res.json({
      results,
      summary: {
        total: transactions.length,
        analyzed: results.length,
        flagged: flagged.length,
        high_risk: high,
        medium_risk: medium,
        low_risk: low,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to process bulk detection",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AuditAI backend running on http://localhost:${PORT}`);
});
