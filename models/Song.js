const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  singer: {
    type: String,
    required: true
  },
  competitionGroup: {
    type: String
  },
  competitionEvent: {
    type: String
  },
  programOrder: {
    type: Number,
    default: 0
  },
  inCompetition: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Song', songSchema);
