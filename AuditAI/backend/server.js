const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ======== MongoDB Connection ========
// CHANGE this URL to your MongoDB connection string
// For local MongoDB: 'mongodb://localhost:27017/auditai'
// For MongoDB Atlas: 'mongodb+srv://username:password@cluster.mongodb.net/auditai'
const MONGO_URI = 'mongodb://localhost:27017/auditai';

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

// ======== Start Server ========
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AuditAI Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/register`);
  console.log(`   POST /api/login`);
  console.log(`   GET  /api/health`);
});
