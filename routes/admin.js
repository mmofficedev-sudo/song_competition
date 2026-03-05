const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const admin = await Admin.findOne({ username: username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare hashed password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ 
      message: 'Login successful',
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize admin (create default admin if doesn't exist)
router.post('/init', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }
    
    const admin = new Admin({
      username: 'admin',
      password: password
    });
    
    await admin.save();
    
    res.status(201).json({ 
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update admin password
router.put('/password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Username, old password, and new password are required' });
    }
    
    const admin = await Admin.findOne({ username: username });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Verify old password
    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid old password' });
    }
    
    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
