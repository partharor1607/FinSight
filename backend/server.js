import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// Verify ES modules are working
console.log('═══════════════════════════════════════════════════════');
console.log('🚀 SERVER STARTING - ES MODULES VERSION');
console.log('═══════════════════════════════════════════════════════');
console.log('✅ Using ES modules (import/export)');
console.log('✅ This is NOT CommonJS (require/module.exports)');
console.log('═══════════════════════════════════════════════════════');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - ES modules avoid caching issues
// Import routes at top level (ES modules support this)
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import uploadRouter from './routes/upload.js';
import insightsRouter from './routes/insights.js';
import categoriesRouter from './routes/categories.js';

// Register routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/categories', categoriesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinSight API is running' });
});

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finsight';
const isAtlas = mongoURI.includes('mongodb+srv://');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: isAtlas ? 10000 : 5000, // Longer timeout for Atlas
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  if (isAtlas) {
    console.log('📡 Connected to MongoDB Atlas (Cloud)');
  } else {
    console.log('💻 Connected to local MongoDB');
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  if (isAtlas) {
    console.log('💡 Tips for MongoDB Atlas:');
    console.log('   1. Check your IP is whitelisted in Network Access');
    console.log('   2. Verify your connection string is correct');
    console.log('   3. Ensure username and password are correct');
  } else {
    console.log('💡 Note: Server will still start, but database operations will fail until MongoDB is running.');
    console.log('💡 To use MongoDB Atlas, set MONGODB_URI in your .env file');
  }
});

// Handle reconnection
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Upload health: http://localhost:${PORT}/api/upload/health`);
});

