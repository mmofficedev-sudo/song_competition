const express = require('express');
const router = express.Router();
const CompetitionConfig = require('../models/CompetitionConfig');

// Get competition configuration
router.get('/', async (req, res) => {
  try {
    const config = await CompetitionConfig.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update current song (event + program order)
router.patch('/current-song', async (req, res) => {
  try {
    const config = await CompetitionConfig.getConfig();
    if (req.body.currentCompetitionEvent !== undefined) config.currentCompetitionEvent = req.body.currentCompetitionEvent || '';
    if (req.body.currentProgramOrder !== undefined) config.currentProgramOrder = req.body.currentProgramOrder;
    config.updatedAt = Date.now();
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update competition configuration
router.put('/', async (req, res) => {
  try {
    let config = await CompetitionConfig.findOne();
    
    if (!config) {
      config = new CompetitionConfig({
        competitionGroups: req.body.competitionGroups || [],
        competitionEvents: req.body.competitionEvents || [],
        currentCompetitionEvent: req.body.currentCompetitionEvent || '',
        currentProgramOrder: req.body.currentProgramOrder != null ? req.body.currentProgramOrder : 1
      });
    } else {
      config.competitionGroups = req.body.competitionGroups || [];
      config.competitionEvents = req.body.competitionEvents || [];
      if (req.body.currentCompetitionEvent !== undefined) config.currentCompetitionEvent = req.body.currentCompetitionEvent || '';
      if (req.body.currentProgramOrder !== undefined) config.currentProgramOrder = req.body.currentProgramOrder;
      config.updatedAt = Date.now();
    }
    
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
