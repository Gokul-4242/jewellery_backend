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

  // Assuming item.weight is provided or default to product.weight
  const appliedWeight = reqItem.weight || product.weight;
  const wastedWeight = appliedWeight + (appliedWeight * (product.wastagePercent / 100));
  const finalPrice = Math.round((wastedWeight * rate) + product.makingCharge + product.stoneCost);
  
  return { rateAtTime: rate, finalPrice };
};

// @desc    Create a new billing transaction with atomic stock deductions and audit
// @route   POST /api/transactions
// @access  Private/Admin
exports.createTransaction = async (req, res, next) => {
  try {
    const { customerId, items, gst, discount, exchangeAmount, idempotencyKey } = req.body;
    
    // Idempotency check 
    if (idempotencyKey) {
      const existing = await Transaction.findOne({ invoiceNo: idempotencyKey });
      if (existing) {
        return res.status(200).json({ success: true, data: existing, message: 'Returning existing transaction (idempotency key match).' });
      }
    }

    const currentRates = await Rate.findOne().sort({ updatedAt: -1 });
    if (!currentRates) return res.status(400).json({ success: false, message: 'Current global rates not set.' });

    let totalAmount = 0;
    const transactionItems = [];

    // Phase 1: Verify & Calculate Backend Price
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found.` });

      const { rateAtTime, finalPrice } = calculatePrice(product, item, currentRates);

      transactionItems.push({
        productId: product._id,
        weight: item.weight || product.weight,
        rateAtTime,
        makingCharge: product.makingCharge,
        wastagePercent: product.wastagePercent,
        finalPrice
      });

      totalAmount += finalPrice;
    }

    const finalBillAmount = Math.round((totalAmount + (gst || 0)) - (discount || 0) - (exchangeAmount || 0));

    // Phase 2: Atomic Stock Deduction (Strict check)
    for (const item of items) {
      const qty = item.quantity || 1;
      const inv = await Inventory.findOneAndUpdate(
        { productId: item.productId, stock: { $gte: qty } },
        { $inc: { stock: -qty }, $set: { lastUpdatedAt: Date.now() } },
        { new: true }
      );

      if (!inv) {
         // Fail gracefully without multi-doc transaction overhead, as per simplified strategy
         return res.status(400).json({ success: false, message: `Insufficient stock for product ${item.productId}.` });
      }
      
      await AuditLog.create({
        entity: 'stock',
        entityId: item.productId,
        action: 'admin_billing_deduction',
        payload: { change: -qty, reason: 'invoice_generated', newStock: inv.stock }
      });
    }

    // Phase 3: Record Transaction
    const invoiceNo = idempotencyKey || `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const transaction = await Transaction.create({
      invoiceNo,
      customerId,
      items: transactionItems,
      gst: gst || 0,
      discount: discount || 0,
      exchangeAmount: exchangeAmount || 0,
      totalAmount: finalBillAmount,
      paymentStatus: 'paid' 
    });

    await AuditLog.create({
      entity: 'transaction',
      entityId: transaction._id,
      action: 'created',
      payload: { invoiceNo, totalAmount: finalBillAmount }
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};
