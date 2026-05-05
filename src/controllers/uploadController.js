const imagekit = require('../services/imageKit');

// @desc    Upload an image to ImageKit via backend
// @route   POST /api/upload
// @access  Private/Admin
exports.uploadImage = async (req, res, next) => {
  try {
    // Multer places multiple files in req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one image file' });
    }

    // Upload all files concurrently to ImageKit
    const uploadPromises = req.files.map(file => {
      return imagekit.upload({
        file: file.buffer, // The binary data 
        fileName: file.originalname,
        folder: '/vgh_products' // Organizes your dashboard
      });
    });

    const responses = await Promise.all(uploadPromises);

    // Returns an array of { url, fileId } that the Product Schema "images" array expects
    const uploadedImages = responses.map(r => ({
      url: r.url,
      fileId: r.fileId
    }));

    res.status(200).json({
      success: true,
      data: uploadedImages
    });

  } catch (error) {
    next(error);
  }
};
