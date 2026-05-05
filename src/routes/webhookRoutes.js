const express = require('express');
const router = express.Router();
const { stripeWebhook } = require('../controllers/webhookController');

// Important: Express needs raw buffer for verify stripe signature
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
