const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  gold24k: { type: Number, required: true },
  gold22k: { type: Number, required: true },
  silver: { type: Number, required: true },
}, { timestamps: { updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Rate', rateSchema);
