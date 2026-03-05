const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  console.error('Please create a .env file with: MONGODB_URI=your_connection_string');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const songRoutes = require('./routes/songs');
const scoreRoutes = require('./routes/scores');
const resultRoutes = require('./routes/results');
const judgeRoutes = require('./routes/judges');
const adminRoutes = require('./routes/admin');
const competitionConfigRoutes = require('./routes/competitionConfig');

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/judges', judgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competition-config', competitionConfigRoutes);

// Serve React app (if built)
const path = require('path');
const fs = require('fs');
const buildPath = path.join(__dirname, 'client/build');

// Check if React build exists
const buildExists = fs.existsSync(buildPath);

if (buildExists) {
  app.use(express.static(buildPath));
  console.log('React build found - serving production build');
} else {
  console.log('React build not found - run "cd client && npm run build" to create it');
  console.log('For development, run "cd client && npm start" in a separate terminal');
}

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Only serve React app if it's not an API route
  if (!req.path.startsWith('/api')) {
    if (buildExists) {
      res.sendFile(path.join(buildPath, 'index.html'));
    } else {
      res.status(503).send(`
        <html>
          <head><title>React App Not Built</title></head>
          <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1>React App Not Built</h1>
            <p>Please build the React app first:</p>
            <pre style="background: #f5f5f5; padding: 20px; display: inline-block; border-radius: 5px;">
cd client
npm run build
cd ..
npm start
            </pre>
            <p>Or for development, run the React dev server:</p>
            <pre style="background: #f5f5f5; padding: 20px; display: inline-block; border-radius: 5px;">
cd client
npm start
            </pre>
            <p>The API is available at <a href="/api/songs">/api/songs</a></p>
          </body>
        </html>
      `);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
