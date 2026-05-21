const User = require('../models/User');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort({ name: 1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private/Admin
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    // Basic check for existing customer by phone or email
    let customer = await User.findOne({ $or: [{ phone }, { email }] });
    if (customer) {
      return res.status(400).json({ success: false, message: 'Customer already exists' });
    }

    customer = await User.create({
      name,
      phone,
      email: email || `${phone}@vgh.com`, // Fallback email if not provided
      role: 'customer'
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};
