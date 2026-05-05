const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');

// Use Memory Storage so we don't save the image on our server disk.
// We intercept it in RAM and pass the Buffer straight to ImageKit.
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5000000 } }); // Limit to 5MB

// Expecting form-data with a key named "images" (up to 5 max)
router.post('/', upload.array('images', 5), uploadImage);

module.exports = router;
