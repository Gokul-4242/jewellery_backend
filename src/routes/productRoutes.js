const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateStock } = require('../controllers/productController');

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById);

router.route('/:id/stock')
  .put(updateStock);

module.exports = router;
