const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Fetch current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      // Item exists, update quantity
      cart.items[itemIndex].quantity += (Number(quantity) || 1);
    } else {
      // New item
      cart.items.push({ productId, quantity: Number(quantity) || 1 });
    }

    await cart.save();
    
    // Populate for return
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change quantity
// @route   PUT /api/cart/update
// @access  Private
exports.updateCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = async (req, res) => {
  const productId = req.params.id;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
