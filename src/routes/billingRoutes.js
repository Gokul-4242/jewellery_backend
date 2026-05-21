const express = require('express');
const router = express.Router();
const { createInvoice } = require('../controllers/billingController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/invoice')
  .post(protect, createInvoice);

module.exports = router;
