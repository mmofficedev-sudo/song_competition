const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  },
  judgeName: {
    type: String,
    required: true
  },
  criteria: {
    entryExit: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    lyricsAccuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    voiceHarmony: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    performanceFlow: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    audienceSupport: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    }
  },
  totalScore: {
    type: Number,
    default: function() {
      return this.criteria.entryExit + 
             this.criteria.lyricsAccuracy + 
             this.criteria.voiceHarmony + 
             this.criteria.performanceFlow + 
             this.criteria.audienceSupport;
    }
  },
  reward: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure totalScore is calculated before saving
scoreSchema.pre('save', function(next) {
  this.totalScore = this.criteria.entryExit + 
                    this.criteria.lyricsAccuracy + 
                    this.criteria.voiceHarmony + 
                    this.criteria.performanceFlow + 
                    this.criteria.audienceSupport;
  next();
});

module.exports = mongoose.model('Score', scoreSchema);
