🔍 AuditAI — Financial Anomaly Detection & Reporting
Catching fraud before the damage is done.
Built for Techfluence Hackathon 2026 — Problem Statement PS-04
📌 What Is AuditAI?
AuditAI is an autonomous AI-powered financial auditing system that monitors company transactions in real time — catching fraud, duplicate payments, and policy violations that slip past human review.
Most tools tell you what is wrong. AuditAI tells you why — in plain English a CFO can act on immediately.
🚨 The Problem
India processed 131 billion UPI transactions in 2024
63 million SMEs have zero affordable fraud detection
Finance teams manually check Excel — catching only ~30% of fraud
Existing tools (SAP, Oracle) cost ₹50+ lakhs — unaffordable for SMEs
By the time fraud is discovered, the quarter has already closed
✅ What AuditAI Does
Feature
Description
📸 Receipt Scanning
Upload a photo — Gemma 4 extracts vendor, amount, date, category
📄 PDF Invoice Analysis
Detects line item anomalies, changed bank accounts
📊 CSV Bulk Detection
Screen 500 transactions in seconds
🧠 AI Reasoning
Plain English explanation for every flag — not just a score
📱 Mobile App
Same detection on Android — Gemma 4 on device
🚨 WhatsApp Alerts
Instant Twilio notification when HIGH risk detected
🏳️ False Positive Management
Users flag TRUE / FALSE POSITIVE / SCAM — system learns
📋 Audit Report
One-click boardroom-ready PDF report
🤖 AI Chatbot
Ask questions about flagged transactions in natural language
🏗️ Architecture
Code
🧠 Detection Engine — 5 Signal Scoring
Every transaction is scored across 5 signals:
Code
🛠️ Tech Stack
Layer
Technology
On-Device AI
Gemma 4 via Ollama
Mobile App
Android (Kotlin)
Web Dashboard
React + Three.js
Backend
Node.js + Express
Anomaly Detection
Statistical scoring + Gemma 4
Notifications
Twilio WhatsApp API
PDF Processing
PDF.js
CSV Parsing
PapaParse
📱 Features
Multi-Format Input
Images — Convert to base64, Gemma 4 reads directly
PDFs — PDF.js renders pages to canvas → sent as images
CSV/Excel — PapaParse extracts rows → bulk analysis
False Positive Management
Every flag can be reviewed and marked:
✅ True — legitimate transaction, clear flag
⚠️ False Positive — system was wrong, vendor whitelisted
🚨 Scam — confirmed fraud, vendor blacklisted
System learns from feedback — alert volume drops over time.
WhatsApp Alerts
Fires instantly when HIGH risk detected:
🚨 Fraud detected
🔁 Duplicate payment
👤 New vendor first payment
🏦 Vendor bank account changed
🌙 After hours payment
📋 Policy violation
AI Chatbot
Ask natural language questions:
"Why was this transaction flagged?"
"Show me all vendors paid after midnight"
"What's the total amount at risk this month?"
🚀 Getting Started
Prerequisites
Bash
Backend Setup
Bash
Web Dashboard Setup
Bash
Android App Setup
Bash
Environment Variables
Env
📊 Demo Dataset
A realistic demo CSV is included with 100 transactions:
✅ 93 clean transactions — real Indian companies
🔁 1 duplicate payment
🚨 5 fraud transactions — all between 1-3AM, no PO, new vendors
Bash
🎯 The Challenge — False Positive Management
"A system that cries wolf five times a day will be muted within a week."
AuditAI solves this with 3 mechanisms:
1. Context over thresholds
Same ₹50,000 means different things for different vendors.
We check amount relative to vendor history — not absolute rules.
2. Multi-signal scoring
A transaction only reaches HIGH risk if multiple signals fire together.
One unusual thing = review. Four unusual things = fraud.
3. Feedback learning
Every false positive marked by the user adjusts vendor tolerance.
Week 1: 47 alerts. Week 3: 18 alerts. Accuracy improves over time.
💰 Business Model
Plan
Price
Transactions
Starter
₹999/month
500/month
Business
₹4,999/month
Unlimited
Enterprise
₹14,999/month
Unlimited + API
White Label
Custom
CA firms & Banks
Target market: 63 million SMEs in India with zero affordable fraud detection.
🔒 Privacy & Security
On-device processing — Gemma 4 runs locally via Ollama
Data never leaves your system — no cloud AI APIs for financial data
DPDP Act 2023 compliant — India's data protection law
No foreign server dependency — works fully offline
👥 Team
Built at Techfluence Hackathon 2026 for Problem Statement PS-04: AuditAI Financial Anomaly Detection & Reporting.
📄 License
MIT License — free to use, modify and distribute.
🙏 Acknowledgements
Ollama — Local LLM runtime
Gemma 4 — Google DeepMind
Twilio — WhatsApp notifications
Techfluence 2026 — Hackathon organizers
�
Built with ❤️ for India's 63 million SMEs 
"We're not replacing auditors. We're giving them superpowers."
