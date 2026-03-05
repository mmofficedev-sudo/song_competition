const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in environment variables');
}

// Connect to MongoDB (with error handling for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Import routes
const songRoutes = require('../routes/songs');
const scoreRoutes = require('../routes/scores');
const resultRoutes = require('../routes/results');
const judgeRoutes = require('../routes/judges');
const adminRoutes = require('../routes/admin');
const competitionConfigRoutes = require('../routes/competitionConfig');

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (!isConnected && !MONGODB_URI) {
      return res.status(500).json({ 
        message: 'Database not configured. Please set MONGODB_URI environment variable.' 
      });
    }
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ 
      message: 'Database connection failed. Please check your configuration.' 
    });
  }
});

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/judges', judgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competition-config', competitionConfigRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', connected: isConnected });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: err.message || 'Internal server error' 
  });
});

// Export for Vercel serverless
module.exports = app;
