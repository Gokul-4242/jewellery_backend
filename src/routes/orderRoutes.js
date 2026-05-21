const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');

const { createCustomOrder } = require('../controllers/orderManagementController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(createOrder);

router.route('/custom')
  .post(protect, createCustomOrder);

module.exports = router;

