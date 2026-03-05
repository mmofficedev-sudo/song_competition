const express = require('express');
const router = express.Router();
const Score = require('../models/Score');
const Song = require('../models/Song');

// Get competition results (rankings)
router.get('/rankings', async (req, res) => {
  try {
    const songs = await Song.find({ inCompetition: true });
    const results = [];

    for (const song of songs) {
      const scores = await Score.find({ songId: song._id });
      
      if (scores.length > 0) {
        const totalScore = scores.reduce((sum, score) => sum + score.totalScore, 0);
        const judgeCount = scores.length;

        // Calculate total for each criteria
        const totalCriteria = {
          entryExit: scores.reduce((sum, s) => sum + s.criteria.entryExit, 0),
          lyricsAccuracy: scores.reduce((sum, s) => sum + s.criteria.lyricsAccuracy, 0),
          voiceHarmony: scores.reduce((sum, s) => sum + s.criteria.voiceHarmony, 0),
          performanceFlow: scores.reduce((sum, s) => sum + s.criteria.performanceFlow, 0),
          audienceSupport: scores.reduce((sum, s) => sum + s.criteria.audienceSupport, 0)
        };

        // Calculate total reward (sum of all rewards)
        const totalReward = scores
          .filter(s => s.reward && s.reward.trim() !== '')
          .map(s => s.reward)
          .join(' | ');

        // Get individual judge rewards
        const judgeRewards = scores.map(score => ({
          judgeName: score.judgeName,
          reward: score.reward || '',
          totalScore: score.totalScore,
          criteria: score.criteria
        }));

        results.push({
          song: song,
          totalScore: totalScore,
          judgeCount: judgeCount,
          totalCriteria: totalCriteria,
          totalReward: totalReward,
          judgeRewards: judgeRewards,
          scores: scores
        });
      }
    }

    // Sort by total score (descending)
    results.sort((a, b) => b.totalScore - a.totalScore);

    // Add ranking
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detailed results for a specific song
router.get('/song/:songId', async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const scores = await Score.find({ songId: req.params.songId });
    
    if (scores.length === 0) {
      return res.json({
        song: song,
        message: 'No scores yet for this song'
      });
    }

    const totalScore = scores.reduce((sum, score) => sum + score.totalScore, 0);

    const totalCriteria = {
      entryExit: scores.reduce((sum, s) => sum + s.criteria.entryExit, 0),
      lyricsAccuracy: scores.reduce((sum, s) => sum + s.criteria.lyricsAccuracy, 0),
      voiceHarmony: scores.reduce((sum, s) => sum + s.criteria.voiceHarmony, 0),
      performanceFlow: scores.reduce((sum, s) => sum + s.criteria.performanceFlow, 0),
      audienceSupport: scores.reduce((sum, s) => sum + s.criteria.audienceSupport, 0)
    };

    // Calculate total reward (sum of all rewards)
    const totalReward = scores
      .filter(s => s.reward && s.reward.trim() !== '')
      .map(s => s.reward)
      .join(' | ');

    // Get individual judge rewards
    const judgeRewards = scores.map(score => ({
      judgeName: score.judgeName,
      reward: score.reward || '',
      totalScore: score.totalScore,
      criteria: score.criteria
    }));

    res.json({
      song: song,
      totalScore: totalScore,
      judgeCount: scores.length,
      totalCriteria: totalCriteria,
      totalReward: totalReward,
      judgeRewards: judgeRewards,
      scores: scores
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
