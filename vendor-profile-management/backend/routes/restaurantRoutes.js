const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const restaurantController = require('../controllers/restaurantController');

// Search & Claim routes (MUST be before /:id routes)
router.get('/search', restaurantController.searchRestaurants);
router.get('/unclaimed', restaurantController.getUnclaimedRestaurants);
router.get('/claimed', restaurantController.getClaimedRestaurants);

// NEW: General user suggestion route
router.post('/suggest', restaurantController.suggestRestaurant);

// ✅ GET all restaurants for current vendor only
router.get('/', async (req, res) => {
  try {
    // Use the test vendor ID
    const vendorId = 'test-vendor-123';
    
    const restaurants = await prisma.restaurant.findMany({
      where: { vendorId: vendorId },
      orderBy: { name: 'asc' }
    });
    
    res.json(restaurants);
  } catch (error) {
    console.error('Restaurants fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Standard CRUD routes
router.post('/', restaurantController.createRestaurant);
router.get('/:id', restaurantController.getRestaurantProfile);
router.put('/:id', restaurantController.updateRestaurantProfile);
router.post('/:id/verification', restaurantController.verifyBusiness);
router.get('/:id/verifications', restaurantController.getRestaurantVerifications);

module.exports = router;