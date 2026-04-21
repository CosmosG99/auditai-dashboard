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
  riskScore: Number,
  reasoning: String,
  riskFlags: [String],
  documentPreview: String, // base64
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
      riskScore: forensicResult.fraud_logic_engine?.false_positive_score || 0,
      reasoning: forensicResult.fraud_logic_engine?.reasoning_summary || 'No reasoning provided',
      riskFlags: forensicResult.fraud_logic_engine?.risk_flags || [],
      documentPreview: documentBase64
    });
    await newRecord.save();

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

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get response', details: err.message });
  }
});

// ======== Start Server ========
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuditAI Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/register`);
  console.log(`   POST /api/login`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/analyze-transaction`);
  console.log(`   POST /api/ask-auditai`);
});
