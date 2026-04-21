import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Event from "./models/Event.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/auditai")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

const OLLAMA_URLS = process.env.OLLAMA_URL
  ? [process.env.OLLAMA_URL]
  : [
      "http://127.0.0.1:11434/api/generate",
      "http://localhost:11434/api/generate",
    ];
const OLLAMA_MODEL = "gemma4";

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- Auth Routes ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Registration attempt for:", email);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();
    console.log("User saved successfully:", email);

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    res.status(500).json({ error: "Registration failed: " + (error instanceof Error ? error.message : "Unknown error") });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      console.log("Invalid login credentials for:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// --- Existing Logic Updated for MongoDB ---

const SYSTEM_PROMPT = `You are AuditAI, an expert financial auditing assistant
powered by Gemma 4 running locally.

You analyze financial documents including images of receipts,
PDF invoices, and CSV transaction files.

Follow the standard AuditAI routines for extraction, detection, and reporting.`;

const CHAT_SYSTEM_PROMPT = `You are AuditAI Chat Assistant for finance teams.
You answer in concise plain English.
Use CFO-friendly language.`;

function safeJson(input, fallback = {}) {
  try {
    return typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return fallback;
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getFalsePositiveAssessment(detection, existing = {}) {
  const probability = Number(
    existing?.false_positive_probability ?? detection?.false_positive_probability ?? 0.5,
  );
  let verdict = "NEEDS_REVIEW";
  if (probability > 0.7) verdict = "LIKELY_SAFE";
  if (probability < 0.4) verdict = "LIKELY_FRAUD";

  return {
    false_positive_probability: probability,
    reasons_it_might_be_safe: safeArray(existing?.reasons_it_might_be_safe),
    reasons_it_might_be_fraud: safeArray(existing?.reasons_it_might_be_fraud),
    verdict,
    human_review_required: existing?.human_review_required ?? true,
  };
}

function normalizeDetection(rawDetection = {}, transaction = {}) {
  return {
    risk_level: rawDetection?.risk_level ?? "MEDIUM",
    anomaly_score: Number(rawDetection?.anomaly_score ?? 0),
    is_anomaly: Boolean(rawDetection?.is_anomaly),
    suspicious_signals: safeArray(rawDetection?.suspicious_signals),
    violated_policies: safeArray(rawDetection?.violated_policies),
    reason: rawDetection?.reason ?? null,
    recommended_action: rawDetection?.recommended_action ?? null,
    confidence: Number(rawDetection?.confidence ?? 0),
    transaction_id: rawDetection?.transaction_id ?? transaction?.id ?? null,
    false_positive_probability: Number(rawDetection?.false_positive_probability ?? 0.5),
    verdict: rawDetection?.verdict ?? "NEEDS_REVIEW",
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
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/api/events", async (_req, res) => {
  try {
    const events = await Event.find().sort({ "audit_event.created_at": -1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/stats", async (_req, res) => {
  try {
    const events = await Event.find();
    
    // Simple logic adapted from the original
    const items = events.map(e => e.toJSON());
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
  
    res.json({
      total_events: items.length,
      total_transactions_reviewed: detectionEvents.length,
      total_flagged: flagged.length,
      high_risk_count: riskBreakdown.high,
      medium_risk_count: riskBreakdown.medium,
      low_risk_count: riskBreakdown.low,
      total_volume: totalVolume,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.patch("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { verdict, feedback } = req.body;
    const event = await Event.findOne({ "audit_event.id": id });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (verdict) {
      event.audit_event.detection = {
        ...(event.audit_event.detection || {}),
        verdict: verdict,
        is_anomaly: verdict === "LIKELY_FRAUD",
      };
      
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

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

app.post("/api/detect", async (req, res) => {
  try {
    const payload = req.body;
    const detectionRaw = await callGemma(payload);
    const detection = normalizeDetection(detectionRaw, payload?.transaction);
    const falsePositiveAssessment = getFalsePositiveAssessment(detection, detectionRaw.false_positive_assessment);

    const count = await Event.countDocuments();
    const event = new Event({
      audit_event: {
        id: `EVT-${String(count + 1).padStart(4, "0")}`,
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
    });

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to process detection" });
  }
});

app.post("/api/extract", async (req, res) => {
  try {
    const payload = req.body;
    const result = await callGemma(payload);
    
    const rawItems = Array.isArray(result) ? result : [result];
    const processedEvents = [];

    const count = await Event.countDocuments();
    let currentCount = count;

    for (const item of rawItems) {
      const extraction = item.extraction || item;
      const detectionRaw = item.detection || null;
      let detection = null;
      let falsePositiveAssessment = null;

      if (detectionRaw) {
        detection = normalizeDetection(detectionRaw, null);
        falsePositiveAssessment = getFalsePositiveAssessment(detection, detectionRaw.false_positive_assessment);
      }

      currentCount++;
      const event = new Event({
        audit_event: {
          id: `EVT-${String(currentCount).padStart(4, "0")}`,
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
      });

      await event.save();
      processedEvents.push(event);
    }

    res.json(processedEvents.length > 1 ? processedEvents : processedEvents[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to process extraction" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    if (!message) return res.status(400).json({ error: "message is required" });

    const reply = await callGemmaText({
      system: CHAT_SYSTEM_PROMPT,
      prompt: message,
    });

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "Failed to process chat" });
  }
});

app.post("/api/detect-bulk", async (req, res) => {
  try {
    const { transactions = [], source_file = "bulk_csv" } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "transactions array is required" });
    }

    const results = [];
    const count = await Event.countDocuments();
    let currentCount = count;

    for (const txRow of transactions) {
      try {
        const payload = {
          source_file,
          transaction: txRow,
          // ... default mocks for analysis context
          vendor_history: {
            times_paid_before: Number(txRow.times_paid_before ?? 0),
            average_amount: Number(txRow.average_amount ?? 0),
          },
          company_policy: {
            max_without_approval: Number(txRow.max_without_approval ?? 50000),
          },
        };

        const detectionRaw = await callGemma(payload);
        const detection = normalizeDetection(detectionRaw, txRow);
        const falsePositiveAssessment = getFalsePositiveAssessment(
          detection,
          detectionRaw.false_positive_assessment
        );

        currentCount++;
        const event = new Event({
          audit_event: {
            id: `EVT-${String(currentCount).padStart(4, "0")}`,
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
        });

        await event.save();
        results.push(event);
      } catch (rowErr) {
        // Fallback for failed rows
        results.push({
          audit_event: { id: "ERR", detection: { risk_level: "MEDIUM", reason: "Analysis failed" } }
        });
      }
    }

    const flagged = results.filter((r) => r.audit_event?.detection?.is_anomaly);
    
    return res.json({
      results,
      summary: {
        total: transactions.length,
        analyzed: results.length,
        flagged: flagged.length,
        high_risk: flagged.filter(r => r.audit_event?.detection?.risk_level === 'HIGH').length,
        medium_risk: flagged.filter(r => r.audit_event?.detection?.risk_level === 'MEDIUM').length,
        low_risk: flagged.filter(r => r.audit_event?.detection?.risk_level === 'LOW').length,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to process bulk detection" });
  }
});

app.listen(PORT, () => {
  console.log(`AuditAI backend running on http://localhost:${PORT}`);
});
