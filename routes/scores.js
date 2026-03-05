const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const Song = require('../models/Song');

// Get all scores
router.get('/', async (req, res) => {
  try {
    const scores = await Score.find().populate('songId').sort({ createdAt: -1 });
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get scores for a specific song
router.get('/song/:songId', async (req, res) => {
  try {
    const scores = await Score.find({ songId: req.params.songId }).populate('songId');
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get scores by judge
router.get('/judge/:judgeName', async (req, res) => {
  try {
    const scores = await Score.find({ judgeName: req.params.judgeName }).populate('songId');
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit or update a score (upsert)
router.post('/', async (req, res) => {
  try {
    // Check if song exists
    const song = await Song.findById(req.body.songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Validate criteria values
    if (!req.body.criteria || 
        typeof req.body.criteria.entryExit !== 'number' ||
        typeof req.body.criteria.lyricsAccuracy !== 'number' ||
        typeof req.body.criteria.voiceHarmony !== 'number' ||
        typeof req.body.criteria.performanceFlow !== 'number' ||
        typeof req.body.criteria.audienceSupport !== 'number') {
      return res.status(400).json({ message: 'Invalid criteria data' });
    }

    // Calculate total score
    const totalScore = req.body.criteria.entryExit + 
                      req.body.criteria.lyricsAccuracy + 
                      req.body.criteria.voiceHarmony + 
                      req.body.criteria.performanceFlow + 
                      req.body.criteria.audienceSupport;

    // Check if score already exists
    const existingScore = await Score.findOne({
      songId: req.body.songId,
      judgeName: req.body.judgeName
    });

    let savedScore;
    if (existingScore) {
      // Update existing score
      savedScore = await Score.findOneAndUpdate(
        {
          songId: req.body.songId,
          judgeName: req.body.judgeName
        },
        {
          $set: {
            'criteria.entryExit': req.body.criteria.entryExit,
            'criteria.lyricsAccuracy': req.body.criteria.lyricsAccuracy,
            'criteria.voiceHarmony': req.body.criteria.voiceHarmony,
            'criteria.performanceFlow': req.body.criteria.performanceFlow,
            'criteria.audienceSupport': req.body.criteria.audienceSupport,
            reward: req.body.reward || '',
            totalScore: totalScore
          }
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new score
      const score = new Score({
        songId: req.body.songId,
        judgeName: req.body.judgeName,
        criteria: req.body.criteria,
        reward: req.body.reward || '',
        totalScore: totalScore
      });
      savedScore = await score.save();
    }

    const populatedScore = await Score.findById(savedScore._id).populate('songId');
    res.status(201).json(populatedScore);
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(400).json({ message: error.message || 'Error saving score' });
  }
});

// Update a score
router.put('/:id', async (req, res) => {
  try {
    const score = await Score.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('songId');
    
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }
    res.json(score);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a score
router.delete('/:id', async (req, res) => {
  try {
    const score = await Score.findByIdAndDelete(req.params.id);
    if (!score) {
      return res.status(404).json({ message: 'Score not found' });
    }
    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
