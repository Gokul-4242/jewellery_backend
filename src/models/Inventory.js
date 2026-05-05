const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true, 
    unique: true 
  },
  stock: { type: Number, required: true, default: 0 },
}, { timestamps: { updatedAt: 'lastUpdatedAt' } });

module.exports = mongoose.model('Inventory', inventorySchema);
