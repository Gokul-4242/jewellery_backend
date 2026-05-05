const Rate = require('../models/Rate');
const AuditLog = require('../models/AuditLog');

// @desc    Get current global rates
// @route   GET /api/rates
// @access  Public
exports.getCurrentRates = async (req, res, next) => {
  try {
    const rate = await Rate.findOne().sort({ updatedAt: -1 });
    if (!rate) {
      return res.status(404).json({ success: false, message: 'No rates configured yet' });
    }
    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// @desc    Update global rates globally and create history log
// @route   POST /api/rates
// @access  Private/Admin
exports.updateRates = async (req, res, next) => {
  try {
    const { gold24k, gold22k, silver } = req.body;

    if (!gold24k || !gold22k || !silver) {
      return res.status(400).json({ success: false, message: 'Please provide rates for gold24k, gold22k, and silver' });
    }

    let rate = await Rate.findOne();
    const oldRates = rate ? { gold24k: rate.gold24k, gold22k: rate.gold22k, silver: rate.silver } : null;

    if (rate) {
      rate.gold24k = gold24k;
      rate.gold22k = gold22k;
      rate.silver = silver;
      await rate.save();
    } else {
      rate = await Rate.create({ gold24k, gold22k, silver });
    }

    // Capture Audit Log separately
    await AuditLog.create({
      entity: 'rate',
      action: 'updated',
      payload: { oldRates, newRates: { gold24k, gold22k, silver } }
    });

    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};
