const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

// Get all songs
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single song
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new song
router.post('/', async (req, res) => {
  try {
    // Explicitly include all fields, including optional ones
    const songData = {
      title: req.body.title,
      artist: req.body.artist,
      singer: req.body.singer,
      competitionGroup: req.body.competitionGroup || '',
      competitionEvent: req.body.competitionEvent || '',
      programOrder: req.body.programOrder || 0,
      inCompetition: req.body.inCompetition || false
    };
    
    const song = new Song(songData);
    const savedSong = await song.save();
    res.status(201).json(savedSong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update song
router.put('/:id', async (req, res) => {
  try {
    // Build update object, explicitly handling all fields including empty strings
    const updateData = {};
    
    // Update all provided fields, including empty strings for optional fields
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.artist !== undefined) updateData.artist = req.body.artist;
    if (req.body.singer !== undefined) updateData.singer = req.body.singer;
    // Explicitly handle competitionGroup and competitionEvent, allowing empty strings
    if (req.body.competitionGroup !== undefined) {
      updateData.competitionGroup = req.body.competitionGroup || '';
    }
    if (req.body.competitionEvent !== undefined) {
      updateData.competitionEvent = req.body.competitionEvent || '';
    }
    if (req.body.programOrder !== undefined) updateData.programOrder = req.body.programOrder;
    if (req.body.inCompetition !== undefined) updateData.inCompetition = req.body.inCompetition;

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete song
router.delete('/:id', async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
