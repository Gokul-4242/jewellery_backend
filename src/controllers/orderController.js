const Order = require('../models/Order');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Rate = require('../models/Rate');
const AuditLog = require('../models/AuditLog');

// @desc    Create online order and reserve stock
// @route   POST /api/orders
// @access  Private/Customer
exports.createOrder = async (req, res, next) => {
  try {
    const { items } = req.body; 
    const userId = req.body.userId || '60d0fe4f5311236168a109ca'; // Placeholder User ID for MVP before Auth wire up

    const currentRates = await Rate.findOne().sort({ updatedAt: -1 });
    if (!currentRates) return res.status(400).json({ success: false, message: 'Global rates missing' });

    let totalAmount = 0;
    const orderItems = [];

    // Phase 1: Dynamic Calculation (Trust backend only)
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found.` });

      let rate;
      if (product.material === 'gold24k') rate = currentRates.gold24k;
      else if (product.material === 'gold22k') rate = currentRates.gold22k;
      else if (product.material === 'silver') rate = currentRates.silver;

      const wastedWeight = product.weight + (product.weight * (product.wastagePercent / 100));
      const unitPrice = Math.round((wastedWeight * rate) + product.makingCharge + product.stoneCost);
      const totalItemPrice = unitPrice * item.quantity;
      
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceSnapshot: unitPrice
      });
      totalAmount += totalItemPrice;
    }

    // Phase 2: Atomic Inventory Deduction
    for (const item of items) {
      const inv = await Inventory.findOneAndUpdate(
        { productId: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity }, $set: { lastUpdatedAt: Date.now() } },
        { new: true }
      );

      if (!inv) return res.status(400).json({ success: false, message: `Insufficient stock for product ${item.productId}.` });

      await AuditLog.create({
        entity: 'stock',
        entityId: item.productId,
        action: 'online_order_deduction',
        payload: { change: -item.quantity, reason: 'customer_checkout', newStock: inv.stock }
      });
    }

    // Phase 3: Create PENDING Order
    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      status: 'PENDING'
    });

    // NOTE: This is where we would trigger Stripe Payment Intent creation logic.

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
