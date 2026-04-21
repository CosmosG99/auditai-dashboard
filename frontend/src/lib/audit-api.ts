export type AuditStats = {
  total_events: number;
  total_transactions_reviewed: number;
  total_flagged: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  total_volume: number;
};

export type AuditDetectionEvent = {
  audit_event: {
    id: string;
    created_at: string;
    source_file?: string;
    extraction: unknown;
    detection: {
      transaction_id: string | null;
      risk_level: "LOW" | "MEDIUM" | "HIGH";
      anomaly_score: number;
      is_anomaly: boolean;
      suspicious_signals: string[];
      violated_policies: string[];
      reason: string | null;
      recommended_action: string | null;
      false_positive_probability: number;
      confidence: number;
    };
    false_positive_assessment: {
      false_positive_probability: number;
      reasons_it_might_be_safe: string[];
      reasons_it_might_be_fraud: string[];
      verdict: "LIKELY_SAFE" | "NEEDS_REVIEW" | "LIKELY_FRAUD";
      human_review_required: boolean;
    };
    feedback: {
      was_false_positive: boolean | null;
      reviewed_by: string | null;
      reviewed_at: string | null;
      notes: string | null;
    };
  };
};

export type AuditEvent = {
  audit_event: {
    id: string;
    created_at: string;
    source_file?: string;
    input_type?: string;
    extraction?: {
      vendor?: string;
      amount?: number;
      currency?: string;
      date?: string;
      time?: string;
      category?: string;
      payment_method?: string;
      invoice_number?: string;
      line_items?: { description: string; amount: number }[];
      confidence?: number;
    } | null;
    detection?: {
      transaction_id: string | null;
      risk_level: "LOW" | "MEDIUM" | "HIGH";
      anomaly_score: number;
      is_anomaly: boolean;
      suspicious_signals: string[];
      violated_policies?: string[];
      reason: string | null;
      recommended_action?: string | null;
      false_positive_probability?: number;
      confidence: number;
      verdict?: string;
    } | null;
    false_positive_assessment?: {
      false_positive_probability: number;
      verdict: "LIKELY_SAFE" | "NEEDS_REVIEW" | "LIKELY_FRAUD";
    } | null;
    report?: {
      executive_summary?: string;
    } | null;
  };
};

const API_BASE = import.meta.env.VITE_AUDIT_BACKEND_URL || "http://localhost:4000";

export async function getAuditStats(): Promise<AuditStats> {
  const response = await fetch(`${API_BASE}/api/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch audit stats");
  }
  return response.json();
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  const response = await fetch(`${API_BASE}/api/events`);
  if (!response.ok) {
    throw new Error("Failed to fetch audit events");
  }
  const body = await response.json();
  return Array.isArray(body.events) ? body.events : [];
}

export async function runChat(message: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error("Failed to chat with AuditAI");
  }
  const body = await response.json();
  return String(body.reply ?? "");
}

export type BulkResult = {
  results: AuditEvent[];
  summary: {
    total: number;
    analyzed: number;
    flagged: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
};

/* ── Parse CSV text into array of row objects ── */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function rowToTransaction(row: Record<string, string>, idx: number) {
  return {
    id: String(row.id ?? row.transaction_id ?? `TXN-${Date.now()}-${idx}`),
    vendor: String(row.vendor ?? "Unknown Vendor"),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "INR"),
    timestamp: String(row.timestamp ?? new Date().toISOString()),
    payment_method: String(row.payment_method ?? "Unknown"),
    department: String(row.department ?? "Operations"),
    has_purchase_order: row.has_purchase_order === "true",
    approved_by: row.approved_by || null,
    category: String(row.category ?? "Supplies"),
    times_paid_before: Number(row.times_paid_before ?? 0),
    average_amount: Number(row.average_amount ?? 0),
    last_payment_date: row.last_payment_date || null,
    always_approved: row.always_approved === "true",
  };
}

/* ── Bulk CSV upload — analyses ALL rows ── */
export async function uploadCsvBulk(file: File): Promise<BulkResult> {
  const rawText = await file.text();
  const rows = parseCsv(rawText);
  if (rows.length === 0) throw new Error("CSV has no data rows");

  const transactions = rows.map((r, i) => rowToTransaction(r, i));

  const response = await fetch(`${API_BASE}/api/detect-bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions, source_file: file.name }),
  });
  if (!response.ok) throw new Error("Failed to run bulk detection");
  return response.json();
}

/* ── Single file upload (images / PDF) - Can return one or multiple events ── */
export async function uploadForAudit(file: File): Promise<AuditEvent | AuditEvent[]> {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  if (extension === "csv") {
    // Fallback: single-row mode for backward compat
    const rawText = await file.text();
    const rows = parseCsv(rawText);
    const row = rows[0] ?? {};
    const tx = rowToTransaction(row, 0);

    const response = await fetch(`${API_BASE}/api/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_file: file.name,
        transaction: tx,
        vendor_history: {
          times_paid_before: tx.times_paid_before,
          average_amount: tx.average_amount,
          last_payment_date: tx.last_payment_date,
          always_approved: tx.always_approved,
        },
        company_policy: {
          max_without_approval: 50000,
          restricted_hours_start: 23,
          restricted_hours_end: 6,
          require_po_above: 50000,
        },
      }),
    });
    if (!response.ok) throw new Error("Failed to run detection for CSV");
    return response.json();
  }

  const toBase64 = (f: File) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.readAsDataURL(f);
  });

  const base64Image = await toBase64(file);

  const extractionPayload = {
    input_type: extension === "pdf" ? "pdf" : "image",
    source_file: file.name,
    prompt: `You are AuditAI. Analyse this financial document (receipt image or PDF invoice).
DO TWO THINGS:
1. Extract ALL financial data for EACH transaction found on the page(s).
2. Analyse EACH extracted transaction for fraud and anomalies.

If multiple transactions are present on the document, return an ARRAY of objects following the schema below. If only one is found, return a single object.

Key fraud checks for each:
- Is the transaction time suspicious (late night / early morning)?
- Does the total amount match the sum of line items?
- Is the vendor name legitimate and recognizable?
- Flag any policy violations.

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
}`,
    images: [base64Image]
  };

  const response = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(extractionPayload),
  });
  if (!response.ok) throw new Error("Failed to run extraction");
  return response.json();
}

export async function updateAuditVerdict(
  id: string, 
  verdict: "LIKELY_SAFE" | "NEEDS_REVIEW" | "LIKELY_FRAUD" | "FALSE_POSITIVE",
  feedback?: any
): Promise<AuditEvent> {
  const response = await fetch(`${API_BASE}/api/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verdict, feedback }),
  });
  if (!response.ok) throw new Error("Failed to update audit verdict");
  return response.json();
}
