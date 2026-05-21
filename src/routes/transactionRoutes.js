const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, updateTransaction } = require('../controllers/transactionController');

router.route('/')
  .post(createTransaction)
  .get(getTransactions);

router.route('/:id')
  .put(updateTransaction);


module.exports = router;
