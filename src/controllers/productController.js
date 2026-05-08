const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.material) {
      query.material = { $regex: req.query.material, $options: 'i' };
    }
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { sku: searchRegex }
      ];
    }

    const products = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'productId',
          as: 'inventory'
        }
      },
      {
        $unwind: {
          path: '$inventory',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          stock: { $ifNull: ['$inventory.stock', 0] }
        }
      },
      {
        $project: {
          inventory: 0
        }
      },
      { $skip: startIndex },
      { $limit: limit }
    ]);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product and initialize stock
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const { initialStock, ...productData } = req.body;
    const product = await Product.create(productData);

    await Inventory.create({
      productId: product._id,
      stock: initialStock || 0
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    // If inventory fails, product should be rolled back ideally, or soft deleted. 
    // We'll manage strict atomic queries inside transactions and orders instead.
    next(error);
  }
};

// @desc    Update stock securely and trigger audit log
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res, next) => {
  try {
    const { change, reason } = req.body;
    
    if (change === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide stock change amount.' });
    }

    // Atomic increment
    const inventory = await Inventory.findOneAndUpdate(
      { productId: req.params.id },
      { $inc: { stock: change }, $set: { lastUpdatedAt: Date.now() } },
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory record not found.' });
    }

    await AuditLog.create({
      entity: 'stock',
      entityId: req.params.id,
      action: change > 0 ? 'manual_add' : 'manual_remove',
      payload: { change, reason, newStock: inventory.stock }
    });

    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete associated inventory
    await Inventory.findOneAndDelete({ productId: req.params.id });

    await product.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

