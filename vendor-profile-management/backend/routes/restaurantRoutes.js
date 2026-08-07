const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');

// Search & Claim routes (MUST be before /:id routes)
router.get('/search', restaurantController.searchRestaurants);
router.get('/unclaimed', restaurantController.getUnclaimedRestaurants);
router.get('/claimed', restaurantController.getClaimedRestaurants);

// NEW: General user suggestion route
router.post('/suggest', restaurantController.suggestRestaurant);

// Standard CRUD routes
router.post('/', restaurantController.createRestaurant);
router.get('/:id', restaurantController.getRestaurantProfile);
router.put('/:id', restaurantController.updateRestaurantProfile);
router.post('/:id/verification', restaurantController.verifyBusiness);
router.get('/:id/verifications', restaurantController.getRestaurantVerifications);

module.exports = router;