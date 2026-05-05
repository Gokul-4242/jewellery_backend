const express = require('express');
const router = express.Router();
const { createTransaction } = require('../controllers/transactionController');

router.route('/')
  .post(createTransaction);

module.exports = router;
