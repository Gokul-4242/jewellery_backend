const express = require('express');
const router = express.Router();
const { getCurrentRates, updateRates } = require('../controllers/rateController');

router.route('/')
  .get(getCurrentRates)
  .post(updateRates);

module.exports = router;
