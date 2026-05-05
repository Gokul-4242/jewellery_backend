const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  material: { type: String, enum: ['gold24k', 'gold22k', 'silver'], required: true },
  weight: { type: Number, required: true },
  makingCharge: { type: Number, required: true },
  wastagePercent: { type: Number, required: true },
  stoneCost: { type: Number, default: 0 },
  images: [{
    url: { type: String },
    fileId: { type: String }
  }],
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' }
}, { timestamps: true });

// Index for faster queries on category (sku is already indexed via unique: true)
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
