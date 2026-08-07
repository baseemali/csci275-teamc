const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/test-vendor', vendorController.getOrCreateTestVendor);
router.get('/:id', vendorController.getVendorProfile);
router.put('/:id', vendorController.updateVendorProfile);
router.get('/:id/settings', vendorController.getNotificationSettings);
router.put('/:id/settings', vendorController.updateNotificationSettings);
router.get('/:vendorId/restaurants', vendorController.getVendorRestaurants);

module.exports = router;