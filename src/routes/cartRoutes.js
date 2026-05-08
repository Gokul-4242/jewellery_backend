const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCart, removeFromCart } = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

// All cart routes are protected
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCart);
router.delete('/:id', removeFromCart);

module.exports = router;
