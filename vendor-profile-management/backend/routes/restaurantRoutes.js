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

// PUBLIC: Get full restaurant profile (no auth required)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            businessName: true,
            logoUrl: true,
            verificationStatus: true,
          }
        },
        menu: {
          orderBy: [{ category: 'asc' }, { name: 'asc' }]
        },
        hours: {
          orderBy: { day: 'asc' }
        },
        tags: true,
        reviews: {
          include: {
            user: { select: { name: true, email: true } },
            response: { select: { responseText: true, createdAt: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 20 // Limit to latest 20 reviews
        },
        verifications: {
          select: { status: true },
          orderBy: { submittedAt: 'desc' },
        },
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Calculate review stats
    const reviewStats = {
      total: restaurant.reviews.length,
      average: restaurant.reviews.length > 0
        ? (restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length).toFixed(1)
        : 0,
      distribution: [5, 4, 3, 2, 1].map(star => ({
        stars: star,
        count: restaurant.reviews.filter(r => r.rating === star).length
      }))
    };

    res.json({ restaurant, reviewStats });
  } catch (error) {
    console.error('Error fetching public restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Standard CRUD routes
router.post('/', restaurantController.createRestaurant);
router.get('/:id', restaurantController.getRestaurantProfile);
router.put('/:id', restaurantController.updateRestaurantProfile);
router.post('/:id/verification', restaurantController.verifyBusiness);
router.get('/:id/verifications', restaurantController.getRestaurantVerifications);

module.exports = router;