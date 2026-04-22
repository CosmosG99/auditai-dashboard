const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const http = require('http');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdf = require('pdf-parse');
const csv = require('csv-parser');
const Tesseract = require('tesseract.js');
const { sendFraudAlert } = require('./whatsapp');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ======== Multer Setup for File Uploads ========
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `upload-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// ======== Ollama Configuration ========
const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma4';

// ======== MongoDB Connection ========
// CHANGE this URL to your MongoDB connection string
// For local MongoDB: 'mongodb://localhost:27017/auditai'
// For MongoDB Atlas: 'mongodb+srv://username:password@cluster.mongodb.net/auditai'
const MONGO_URI = 'mongodb+srv://waylenbarreto_db_user:Waylen123@cluster0.7idoesj.mongodb.net/auditai_app';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ======== User Schema ========
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  organization: { type: String, default: '' },
  role: { type: String, default: 'Auditor' },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ======== Audit Record Schema ========
const auditRecordSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' }, // Can be linked to User model later
  fileName: String,
  vendorName: String,
  amount: Number,
  category: String,
  status: String, // proper, fake, potential_false_positive
  riskScore: { type: Number, default: 0 },
  falsePositiveScore: { type: Number, default: 0 },
  reasoning: String,
  riskFlags: [String],
  documentPreview: String, // base64
  userFeedback: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const AuditRecord = mongoose.model('AuditRecord', auditRecordSchema);

// ======== Routes ========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AuditAI Backend is running' });
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, organization, role, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      phone: phone || '',
      organization: organization || '',
      role: role || 'Auditor',
      password: hashedPassword,
    });

    await user.save();
    console.log(`✅ User registered: ${email}`);
    res.status(201).json({ message: 'Registration successful' });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    console.log(`✅ User logged in: ${email}`);
    res.status(200).json({
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        role: user.role,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ======== Ollama Analysis Helper ========
async function queryOllamaSync(prompt, images = []) {
  const startTime = Date.now();
  console.log(`🤖 Starting Ollama analysis (Model: ${OLLAMA_MODEL})...`);
  
  return new Promise((resolve, reject) => {
    const payload = {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      temperature: 0.7,
    };

    if (images && images.length > 0) {
      payload.images = images;
      console.log(`📸 Document images attached (${images.length})`);
    }

    const postData = JSON.stringify(payload);

    const options = {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 300000 // 5 minutes for heavy forensic auditing
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`✅ Ollama analysis complete (${duration}s)`);
          const response = JSON.parse(data);
          resolve(response.response || '');
        } catch (e) {
          console.error(`❌ Failed to parse Ollama response: ${e.message}`);
          reject(new Error('Failed to parse Ollama response'));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timeout'));
    });
    req.write(postData);
    req.end();
  });
}

// ======== Autonomous File Upload & Forensic Analysis ========
app.post('/api/upload-and-analyze', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    console.log(`📂 Processing file: ${req.file.originalname} (${fileExt})`);

    // 1. Autonomous Extraction Strategy
    if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
      // IMAGE: Use Tesseract OCR
      console.log('🖼️  Running OCR (Tesseract)...');
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      extractedText = text;
    } 
    else if (fileExt === '.pdf') {
      // PDF: Extract raw text
      console.log('📄 Parsing PDF...');
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } 
    else if (fileExt === '.csv') {
      // CSV: Sample rows to text
      console.log('📊 Parsing CSV...');
      const results = [];
      await new Promise((resolve) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => results.push(JSON.stringify(data)))
          .on('end', () => resolve());
      });
      extractedText = results.slice(0, 15).join('\n');
    }

    if (!extractedText || extractedText.trim().length < 5) {
      throw new Error('Could not extract meaningful text from document.');
    }

    // 2. Master Forensic Analysis Prompt (Strict JSON Output)
    const analysisPrompt = `You are a specialized Forensic Financial Auditor and Anomaly Detection Engine.

TASK: Analyze the provided text EXTRACTED from a document. You must identify fraudulent patterns and extract core metadata.

DOCUMENT TEXT:
\"\"\"
${extractedText}
\"\"\"

SCORING SYSTEM:
- risk_score: 0 to 100 (0=Safe, 100=Certain Fraud). MUST NOT BE 0 if any flags are found.
- false_positive_score: 0 to 100 (Probability that this detection is an error).
- IF STATUS IS 'fake', risk_score MUST be > 75.
- IF STATUS IS 'proper', risk_score MUST be < 20.

HEURISTICS:
- Temporal Anomaly (Time vs Vendor Industry)
- Amount vs Domain (Legitimacy of value)
- Data Integrity (Formatting/Logic errors)

REQUIRED JSON OUTPUT FORMAT (YOU MUST RETURN ONLY THIS JSON):
{
  "extracted_data": {
    "vendor_name": "string",
    "amount_inr": 0.00,
    "category": "Supplies | Travel | Meals | Utilities | Others",
    "payment_method": "string",
    "transaction_timestamp": "HH:MM | YYYY-MM-DD"
  },
  "fraud_logic_engine": {
    "risk_score": 0,
    "false_positive_score": 0, 
    "status": "proper | fake | potential_false_positive",
    "reasoning_summary": "Forensic explanation of the detected pattern.",
    "risk_flags": ["LIST_OF_FLAGS"]
  },
  "user_interface_actions": {
    "allow_manual_approval": true,
    "save_to_history": true
  }
}`;

    const analysis = await queryOllamaSync(analysisPrompt);
    
    let forensicResult;
    try {
      forensicResult = JSON.parse(analysis);
    } catch (e) {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      forensicResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to extract JSON' };
    }

    // Read file as base64 for preview before deletion
    const fileBuffer = await fs.readFile(filePath);
    const documentBase64 = `data:image/${req.file.mimetype.split('/')[1]};base64,${fileBuffer.toString('base64')}`;

    // Cleanup uploaded file
    await fs.remove(filePath);

    // 3. PERSISTENCE: Save to MongoDB
    const newRecord = new AuditRecord({
      fileName: req.file.originalname,
      vendorName: forensicResult.extracted_data?.vendor_name || 'Unknown',
      amount: forensicResult.extracted_data?.amount_inr || 0,
      category: forensicResult.extracted_data?.category || 'Others',
      status: forensicResult.fraud_logic_engine?.status || 'unknown',
      riskScore: forensicResult.fraud_logic_engine?.risk_score || 0,
      falsePositiveScore: forensicResult.fraud_logic_engine?.false_positive_score || 0,
      reasoning: forensicResult.fraud_logic_engine?.reasoning_summary || 'No reasoning provided',
      riskFlags: forensicResult.fraud_logic_engine?.risk_flags || [],
      documentPreview: documentBase64
    });
    await newRecord.save();

    // 4. ALERTS: Trigger WhatsApp Alert for EVERY detection
    const isHighRisk = newRecord.status === 'fake' || newRecord.riskScore > 75;
    const alertTemplate = isHighRisk 
      ? `🚨 *CRITICAL FRAUD ALERT*
*Vendor:* ${newRecord.vendorName}
*Amount:* ₹${newRecord.amount}
*Risk Score:* ${newRecord.riskScore}%
*FP Chance:* ${newRecord.falsePositiveScore}%

⚠️ *Reason:* ${newRecord.reasoning}`
      : `✅ *TRANSACTION PROCESSED*
*Vendor:* ${newRecord.vendorName}
*Amount:* ₹${newRecord.amount}
*Status:* ${newRecord.status?.toUpperCase()}
*Risk Score:* ${newRecord.riskScore}%`;

    await sendFraudAlert({
      message: alertTemplate,
      phone: '9359611406'
    });

    res.json({
      audit_event: {
        id: newRecord._id,
        created_at: newRecord.createdAt,
        file_name: newRecord.fileName,
        analysis: forensicResult,
        document_preview: documentBase64
      }
    });

  } catch (err) {
    console.error('Forensic Extraction error:', err);
    res.status(500).json({ error: 'Failed to process document', details: err.message });
  }
});

// ======== Audit History Endpoint ========
app.get('/api/audit-history', async (req, res) => {
  try {
    const history = await AuditRecord.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ======== Ask AuditAI Endpoint (for Chat) ========
app.post('/api/ask-auditai', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `Persona: You are "FinGuard AI." You only answer questions regarding financial transactions, fraud detection, and bill analysis.

Rules:
1. If a user asks about a transaction, explain the risk profile (e.g., "Why is this 50k debit suspicious?")
2. If a user asks non-financial questions (fitness, coding, vlogging), respond with: "I am restricted to financial integrity and anomaly detection. Please provide a transaction-related query."
3. Always provide a Reasoning Path for any anomaly you detect.
4. Maintain a professional, forensic tone.`;

    const fullPrompt = `${systemPrompt}\n\n${context ? `Previous context: ${context}\n` : ''}User: ${message}\n\nAssistant:`;

    const response = await queryOllamaSync(fullPrompt);
    res.json({ response: response });

  } catch (error) {
    console.error('Audit History Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Update user feedback for an audit record
app.patch('/api/audit-record/:id/feedback', async (req, res) => {
  try {
    const { feedback } = req.body;
    const record = await AuditRecord.findByIdAndUpdate(
      req.params.id,
      { userFeedback: feedback },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: Dashboard Alias for Feedback
app.patch('/api/events/:id', async (req, res) => {
  try {
    const { verdict } = req.body;
    
    const record = await AuditRecord.findByIdAndUpdate(
      req.params.id,
      { userFeedback: verdict },
      { new: true }
    );
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======== Web Dashboard Unified Endpoints ========

app.get('/api/stats', async (req, res) => {
  try {
    const history = await AuditRecord.find();
    let total_flagged = 0, high_risk_count = 0, medium_risk_count = 0, low_risk_count = 0, total_volume = 0;

    for (const record of history) {
      if (record.status === 'fake') { total_flagged++; high_risk_count++; }
      else if (record.status === 'potential_false_positive') { total_flagged++; medium_risk_count++; }
      else { low_risk_count++; }
      total_volume += Number(record.amount) || 0;
    }

    res.json({
      total_events: history.length,
      total_transactions_reviewed: history.length,
      total_flagged,
      high_risk_count,
      medium_risk_count,
      low_risk_count,
      total_volume
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const history = await AuditRecord.find().sort({ createdAt: -1 });
    const events = history.map(record => ({
      audit_event: {
        id: record._id.toString(),
        created_at: record.createdAt,
        source_file: record.fileName,
        extraction: {
          vendor: record.vendorName,
          amount: record.amount,
          category: record.category
        },
        detection: {
          risk_level: record.status === 'fake' ? 'HIGH' : record.status === 'potential_false_positive' ? 'MEDIUM' : 'LOW',
          anomaly_score: record.riskScore || 0,
          is_anomaly: record.status !== 'proper',
          suspicious_signals: record.riskFlags || [],
          reason: record.reasoning || '',
          verdict: record.status === 'fake' ? 'LIKELY_FRAUD' : record.status === 'potential_false_positive' ? 'NEEDS_REVIEW' : 'LIKELY_SAFE',
          false_positive_probability: record.falsePositiveScore || 0
        },
        feedback: {
          was_false_positive: record.userFeedback === 'false_positive',
          status: record.userFeedback
        }
      }
    }));
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const systemPrompt = `Persona: You are "FinGuard AI." You only answer questions regarding financial transactions, fraud detection, and bill analysis. Always provide a Reasoning Path.`;
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;
    const response = await queryOllamaSync(fullPrompt);
    res.json({ reply: response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/extract', async (req, res) => {
  try {
    const { input_type, source_file, images } = req.body;
    let extractedText = '';

    if (images && images.length > 0) {
      const base64Data = images[0];
      const buffer = Buffer.from(base64Data, 'base64');
      const tempPath = path.join(__dirname, 'uploads', `temp_${Date.now()}.${input_type === 'pdf' ? 'pdf' : 'png'}`);
      await fs.writeFile(tempPath, buffer);

      if (input_type === 'pdf') {
        const data = await pdf(buffer);
        extractedText = data.text;
      } else {
        const { data: { text } } = await Tesseract.recognize(tempPath, 'eng');
        extractedText = text;
      }
      await fs.remove(tempPath);
    }
    
    const analysisPrompt = `You are a forensic auditor. Analyze the following document text and output a JSON object describing the transaction and its fraud risk.

EXTRACTED TEXT:
"""
${extractedText}
"""

SCORING SYSTEM:
- risk_score: 0 to 100 (0=Safe, 100=Certain Fraud). MUST NOT BE 0 if any flags are found.
- false_positive_score: 0 to 100 (Probability that this detection is an error).
- IF STATUS IS 'fake', risk_score MUST be > 75.
- IF STATUS IS 'proper', risk_score MUST be < 20.

HEURISTICS:
- Temporal Anomaly (Time vs Vendor Industry)
- Amount vs Domain (Legitimacy of value)
- Data Integrity (Formatting/Logic errors)

REQUIRED JSON OUTPUT FORMAT:
{
  "extracted_data": {
    "vendor_name": "string",
    "amount_inr": 0.00,
    "category": "string"
  },
  "fraud_logic_engine": {
    "risk_score": 0,
    "false_positive_score": 0, 
    "status": "proper | fake | potential_false_positive",
    "reasoning_summary": "Forensic explanation",
    "risk_flags": ["LIST_OF_FLAGS"]
  }
}`;

    const analysis = await queryOllamaSync(analysisPrompt);
    let forensicResult;
    try {
      forensicResult = JSON.parse(analysis);
    } catch (e) {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      forensicResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed JSON parse' };
    }

    const documentBase64 = images && images.length > 0 ? `data:image/${input_type === 'pdf' ? 'pdf' : 'png'};base64,${images[0]}` : null;

    const newRecord = new AuditRecord({
      fileName: source_file || 'Dashboard Upload',
      vendorName: forensicResult.extracted_data?.vendor_name || 'Unknown',
      amount: forensicResult.extracted_data?.amount_inr || 0,
      category: forensicResult.extracted_data?.category || 'Others',
      status: forensicResult.fraud_logic_engine?.status || 'unknown',
      riskScore: forensicResult.fraud_logic_engine?.risk_score || 0,
      falsePositiveScore: forensicResult.fraud_logic_engine?.false_positive_score || 0,
      reasoning: forensicResult.fraud_logic_engine?.reasoning_summary || 'No reasoning provided',
      riskFlags: forensicResult.fraud_logic_engine?.risk_flags || [],
      documentPreview: documentBase64
    });
    await newRecord.save();

    // Trigger WhatsApp Alert exactly like mobile
    const isHighRisk = newRecord.status === 'fake' || newRecord.riskScore > 75;
    const alertTemplate = isHighRisk 
      ? `🚨 *CRITICAL FRAUD ALERT*\n*Vendor:* ${newRecord.vendorName}\n*Amount:* ₹${newRecord.amount}\n*Risk Score:* ${newRecord.riskScore}%\n*FP Chance:* ${newRecord.falsePositiveScore}%\n\n⚠️ *Reason:* ${newRecord.reasoning}`
      : `✅ *TRANSACTION PROCESSED*\n*Vendor:* ${newRecord.vendorName}\n*Amount:* ₹${newRecord.amount}\n*Status:* ${newRecord.status?.toUpperCase()}\n*Risk Score:* ${newRecord.riskScore}%`;

    await sendFraudAlert({ message: alertTemplate, phone: '9359611406' }).catch(console.error);

    res.json({
      audit_event: {
        id: newRecord._id.toString(),
        created_at: newRecord.createdAt,
        source_file: newRecord.fileName,
        extraction: {
          vendor: newRecord.vendorName,
          amount: newRecord.amount,
        },
        detection: {
          risk_level: newRecord.status === 'fake' ? 'HIGH' : newRecord.status === 'potential_false_positive' ? 'MEDIUM' : 'LOW',
          anomaly_score: newRecord.riskScore,
          is_anomaly: newRecord.status !== 'proper',
          suspicious_signals: newRecord.riskFlags,
          reason: newRecord.reasoning,
          verdict: newRecord.status === 'fake' ? 'LIKELY_FRAUD' : newRecord.status === 'potential_false_positive' ? 'NEEDS_REVIEW' : 'LIKELY_SAFE',
          false_positive_probability: newRecord.falsePositiveScore
        }
      }
    });
  } catch (err) {
    console.error('Extract endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/detect', async (req, res) => {
  try {
    const { transaction, source_file } = req.body;
    // Redirect logic to bulk with 1 item
    req.body.transactions = [transaction];
    req.url = '/api/detect-bulk';
    app.handle(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/detect-bulk', async (req, res) => {
  try {
    const { transactions, source_file } = req.body;
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'transactions array required' });
    }

    console.log(`📊 Processing bulk CSV payload with ${transactions.length} items`);
    const results = [];
    let flagged = 0, high_risk = 0, medium_risk = 0, low_risk = 0;

    const chunks = [];
    for(let i=0; i<transactions.length; i+=10) {
      chunks.push(transactions.slice(i, i+10));
    }

    for (const chunk of chunks) {
      const prompt = `You are a forensic auditor processing multiple financial transactions in bulk.
Evaluate the following array of JSON transactions and output an array of corresponding analysis results IN THE EXACT SAME ORDER.

INPUT TRANSACTIONS:
${JSON.stringify(chunk, null, 2)}

SCORING SYSTEM for each:
- risk_score: 0 to 100 (0=Safe, 100=Certain Fraud). MUST NOT BE ZERO if status is fake.
- false_positive_score: 0 to 100.
STATUS options: 'proper', 'fake', 'potential_false_positive'
IF STATUS IS 'fake', risk_score MUST be > 75.
IF STATUS IS 'proper', risk_score MUST be < 25.

OUTPUT FORMAT MUST BE A STRICT JSON ARRAY of objects (No markdown, no explanation, only the array):
[
  {
    "status": "proper | fake | potential_false_positive",
    "risk_score": 0,
    "false_positive_score": 0,
    "reasoning_summary": "Short explanation",
    "risk_flags": ["FLAG1"]
  }
]`;

      let analysisJsonText = await queryOllamaSync(prompt);
      let parsed = [];
      try {
        const jsonMatch = analysisJsonText.match(/\[[\s\S]*\]/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch (e) {
        parsed = chunk.map(() => ({status: 'proper', risk_score: 0, false_positive_score: 0, reasoning_summary: 'Fallback: Format Parse Error', risk_flags: []}));
      }

      for (let i = 0; i < chunk.length; i++) {
        const tx = chunk[i];
        const det = parsed[i] || {status: 'proper', risk_score: 0, false_positive_score: 0, reasoning_summary: 'Unhandled', risk_flags: []};

        const newRecord = new AuditRecord({
          fileName: source_file || 'CSV Upload',
          vendorName: tx.vendor || 'Unknown',
          amount: Number(tx.amount) || 0,
          category: tx.category || 'General',
          status: det.status,
          riskScore: det.risk_score || 0,
          falsePositiveScore: det.false_positive_score || 0,
          reasoning: det.reasoning_summary || 'Processed',
          riskFlags: det.risk_flags || []
        });
        await newRecord.save();

        if (newRecord.status === 'fake' || newRecord.riskScore > 75) {
            high_risk++; flagged++;
            const alertTemplate = `🚨 *BULK FRAUD DETECTED*\n*Vendor:* ${newRecord.vendorName}\n*Amount:* ₹${newRecord.amount}\n*Risk:* ${newRecord.riskScore}%\n\n⚠️ *Reason:* ${newRecord.reasoning}`;
            sendFraudAlert({ message: alertTemplate, phone: '9359611406' }).catch(()=>{});
        } else if (newRecord.status === 'potential_false_positive' || newRecord.riskScore >= 25) {
            medium_risk++; flagged++;
        } else {
            low_risk++;
        }

        results.push({
          audit_event: {
            id: newRecord._id.toString(),
            created_at: newRecord.createdAt,
            source_file: newRecord.fileName,
            extraction: { vendor: newRecord.vendorName, amount: newRecord.amount, category: newRecord.category },
            detection: {
              risk_level: newRecord.status === 'fake' ? 'HIGH' : newRecord.status === 'potential_false_positive' ? 'MEDIUM' : 'LOW',
              anomaly_score: newRecord.riskScore,
              is_anomaly: newRecord.status !== 'proper',
              suspicious_signals: newRecord.riskFlags,
              reason: newRecord.reasoning,
              verdict: newRecord.status === 'fake' ? 'LIKELY_FRAUD' : newRecord.status === 'potential_false_positive' ? 'NEEDS_REVIEW' : 'LIKELY_SAFE',
              false_positive_probability: newRecord.falsePositiveScore
            }
          }
        });
      }
    }

    if (req.url === '/api/detect') {
      res.json(results[0]);
    } else {
      res.json({ results, summary: { total: transactions.length, analyzed: transactions.length, flagged, high_risk, medium_risk, low_risk } });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ======== Start Server ========
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuditAI Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/upload-and-analyze`);
  console.log(`   POST /api/extract`);
  console.log(`   GET  /api/stats`);
  console.log(`   GET  /api/events`);
});
