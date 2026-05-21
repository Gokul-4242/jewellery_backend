const Transaction = require('../models/Transaction');
const Rate = require('../models/Rate');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// @desc    Create a bespoke custom order (Job Order)
// @route   POST /api/orders/custom
// @access  Private/Admin
exports.createCustomOrder = async (req, res, next) => {
  try {
    const { 
      customerName, 
      items, 
      gst, 
      discount, 
      exchangeAmount, 
      status, 
      paymentStatus, 
      deadline, 
      idempotencyKey 
    } = req.body;

    const currentRates = await Rate.findOne().sort({ updatedAt: -1 });
    if (!currentRates) return res.status(400).json({ success: false, message: 'Rates not set.' });

    const transactionItems = items.map(item => ({
      name: item.name || 'Custom Bespoke Item',
      weight: item.weight || 0,
      rateAtTime: currentRates.gold22k,
      makingCharge: item.makingCharges || 0,
      wastagePercent: item.wastage || 0,
      finalPrice: item.total || 0
    }));

    const totalAmount = transactionItems.reduce((acc, item) => acc + item.finalPrice, 0);
    const finalBillAmount = Math.round((totalAmount + (gst || 0)) - (discount || 0) - (exchangeAmount || 0));

    const invoiceNo = idempotencyKey || `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const order = await Transaction.create({
      invoiceNo,
      customerName: customerName || 'Unknown',
      items: transactionItems,
      gst: gst || 0,
      discount: discount || 0,
      exchangeAmount: exchangeAmount || 0,
      totalAmount: finalBillAmount,
      status: status || 'Pending',
      paymentStatus: paymentStatus || 'Pending',
      deadline: deadline,
      date: new Date().toISOString()
    });


    await AuditLog.create({
      entity: 'custom_order',
      entityId: order._id,
      action: 'created',
      payload: { invoiceNo, totalAmount: finalBillAmount }
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
