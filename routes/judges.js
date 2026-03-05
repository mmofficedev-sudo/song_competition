const express = require('express');
const router = express.Router();
const Judge = require('../models/Judge');

// Get all judges
router.get('/', async (req, res) => {
  try {
    const judges = await Judge.find().select('-password').sort({ name: 1 });
    res.json(judges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single judge (without password)
router.get('/:id', async (req, res) => {
  try {
    const judge = await Judge.findById(req.params.id).select('-password');
    if (!judge) {
      return res.status(404).json({ message: 'Judge not found' });
    }
    res.json(judge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create judges (admin only - bulk create)
router.post('/create', async (req, res) => {
  try {
    const { count } = req.body;
    
    if (!count || count < 1 || count > 50) {
      return res.status(400).json({ message: 'Judge count must be between 1 and 50' });
    }

    // Delete existing judges
    await Judge.deleteMany({});
    
    const judges = [];
    const passwords = [];
    
    for (let i = 1; i <= count; i++) {
      const judgeName = `judge${i}`;
      // Generate a simple password (can be customized)
      const password = req.body.passwords && req.body.passwords[i - 1] 
        ? req.body.passwords[i - 1] 
        : `judge${i}123`; // Default password
      
      const judge = new Judge({
        name: judgeName,
        password: password
      });
      
      await judge.save();
      judges.push({ name: judge.name, id: judge._id });
      passwords.push({ name: judge.name, password: password });
    }
    
    res.status(201).json({ 
      message: `Created ${count} judges successfully`,
      judges: judges,
      passwords: passwords
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update judge password
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Find judge and update password (hashing will happen in pre-save hook)
    const judge = await Judge.findById(req.params.id);
    if (!judge) {
      return res.status(404).json({ message: 'Judge not found' });
    }
    
    judge.password = password; // Will be hashed by pre-save hook
    await judge.save();
    
    const updatedJudge = await Judge.findById(req.params.id).select('-password');
    res.json({ message: 'Password updated successfully', judge: updatedJudge });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Judge login
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }
    
    const judge = await Judge.findOne({ name: name });
    if (!judge) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare hashed password
    const isMatch = await judge.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ 
      message: 'Login successful',
      judge: {
        id: judge._id,
        name: judge.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete all judges
router.delete('/all', async (req, res) => {
  try {
    await Judge.deleteMany({});
    res.json({ message: 'All judges deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete single judge
router.delete('/:id', async (req, res) => {
  try {
    const judge = await Judge.findByIdAndDelete(req.params.id);
    if (!judge) {
      return res.status(404).json({ message: 'Judge not found' });
    }
    res.json({ message: 'Judge deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
