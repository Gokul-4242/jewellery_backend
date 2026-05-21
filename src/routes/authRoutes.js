const express = require('express');
const router = express.Router();
const { login, register, updatePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;

