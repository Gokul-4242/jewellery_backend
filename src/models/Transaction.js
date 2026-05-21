const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String }, // Store name at time of order
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
  status: { type: String, enum: ['Pending', 'In Production', 'Quality Check', 'Completed', 'Cancelled'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' },
  deadline: { type: Date },
}, { timestamps: true });


module.exports = mongoose.model('Transaction', transactionSchema);
