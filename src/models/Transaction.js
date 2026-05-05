const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      weight: { type: Number, required: true },
      rateAtTime: { type: Number, required: true },
      makingCharge: { type: Number, required: true },
      wastagePercent: { type: Number, required: true },
      finalPrice: { type: Number, required: true }
    }
  ],
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  exchangeAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
