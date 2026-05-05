const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// @desc    Stripe Webhook handler
// @route   POST /api/webhooks/stripe
// @access  Public (stripe signature verified)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Stripe constructEvent requires the raw unparsed body
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      if (paymentIntent.metadata && paymentIntent.metadata.orderId) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          status: 'SUCCESS',
          'paymentDetails.paymentId': paymentIntent.id,
          'paymentDetails.gatewayResponse': event.data.object
        });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      
      if (paymentIntent.metadata && paymentIntent.metadata.orderId) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          status: 'FAILED',
          'paymentDetails.paymentId': paymentIntent.id,
          'paymentDetails.gatewayResponse': event.data.object
        });
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook DB error:', error);
    res.status(500).json({ error: 'Database update failed' });
  }
};
