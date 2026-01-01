import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finsight';
const isAtlas = mongoURI.includes('mongodb+srv://');

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 MongoDB Connection Check');
console.log('═══════════════════════════════════════════════════════');
console.log('Connection String:', mongoURI.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('Type:', isAtlas ? '📡 MongoDB Atlas (Cloud)' : '💻 Local MongoDB');
console.log('═══════════════════════════════════════════════════════');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: isAtlas ? 10000 : 5000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  if (isAtlas) {
    console.log('📡 Connected to MongoDB Atlas (Cloud)');
  } else {
    console.log('💻 Connected to local MongoDB');
  }
  console.log('Database:', mongoose.connection.db.databaseName);
  console.log('Host:', mongoose.connection.host);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  if (isAtlas) {
    console.log('💡 Tips for MongoDB Atlas:');
    console.log('   1. Check your IP is whitelisted in Network Access');
    console.log('   2. Verify your connection string is correct');
    console.log('   3. Ensure username and password are correct');
  } else {
    console.log('💡 Note: Make sure local MongoDB is running');
  }
  process.exit(1);
});

