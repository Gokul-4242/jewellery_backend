const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Rate = require('../models/Rate');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

const calculatePrice = (product, reqItem, rateDoc) => {
  let rate;
  if (product.material === 'gold24k') rate = rateDoc.gold24k;
  else if (product.material === 'gold22k') rate = rateDoc.gold22k;
  else if (product.material === 'silver') rate = rateDoc.silver;

  const appliedWeight = reqItem.weight || product.weight;
  const wastedWeight = appliedWeight + (appliedWeight * (product.wastagePercent / 100));
  const finalPrice = Math.round((wastedWeight * rate) + product.makingCharge + product.stoneCost);
  
  return { rateAtTime: rate, finalPrice };
};

// @desc    Create a new billing invoice for existing products
// @route   POST /api/billing/invoice
// @access  Private/Admin
exports.createInvoice = async (req, res, next) => {
  try {
    const { 
        customerName, 
        items, 
        gst, 
        discount, 
        exchangeAmount, 
        paymentStatus,
        idempotencyKey 
    } = req.body;

    const currentRates = await Rate.findOne().sort({ updatedAt: -1 });
    if (!currentRates) return res.status(400).json({ success: false, message: 'Rates missing.' });

    let totalAmount = 0;
    const transactionItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue; // Skip if product not found

      const { rateAtTime, finalPrice } = calculatePrice(product, item, currentRates);

      transactionItems.push({
        productId: product._id,
        name: product.name,
        weight: item.weight || product.weight,
        rateAtTime,
        makingCharge: product.makingCharge,
        wastagePercent: product.wastagePercent,
        finalPrice
      });

      totalAmount += finalPrice;

      // Stock Deduction
      const qty = item.quantity || 1;
      await Inventory.findOneAndUpdate(
        { productId: item.productId, stock: { $gte: qty } },
        { $inc: { stock: -qty }, $set: { lastUpdatedAt: Date.now() } }
      );
    }

    const finalBillAmount = Math.round((totalAmount + (gst || 0)) - (discount || 0) - (exchangeAmount || 0));
    const invoiceNo = idempotencyKey || `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const transaction = await Transaction.create({
      invoiceNo,
      customerName: customerName || 'Guest',
      items: transactionItems,
      gst: gst || 0,
      discount: discount || 0,
      exchangeAmount: exchangeAmount || 0,
      totalAmount: finalBillAmount,
      status: 'Completed',
      paymentStatus: paymentStatus || 'Paid',
      date: new Date().toISOString()
    });


    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};
