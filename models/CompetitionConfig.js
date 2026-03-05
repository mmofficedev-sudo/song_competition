const mongoose = require('mongoose');

const competitionConfigSchema = new mongoose.Schema({
  competitionGroups: [{
    type: String,
    required: true
  }],
  competitionEvents: [{
    type: String,
    required: true
  }],
  currentCompetitionEvent: { type: String, default: '' },
  currentProgramOrder: { type: Number, default: 1 },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure there's only one config document
competitionConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = new this({
      competitionGroups: ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F'],
      competitionEvents: ['Event 1', 'Event 2', 'Event 3', 'Event 4', 'Event 5', 'Event 6', 'Event 7', 'Event 8']
    });
    await config.save();
  }
  return config;
};

module.exports = mongoose.model('CompetitionConfig', competitionConfigSchema);
