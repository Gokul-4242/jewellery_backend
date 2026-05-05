const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  password: { type: String },
  totalSpend: { type: Number, default: 0 } // Customer module metric
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
