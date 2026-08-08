const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const whereClause = {};
    if (restaurantId && restaurantId !== 'all') {
      whereClause.restaurantId = restaurantId;
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        response: true,
        flags: true,
        user: { select: { name: true, email: true } },
        restaurant: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET statistics
router.get('/statistics', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const whereClause = {};
    if (restaurantId && restaurantId !== 'all') {
      whereClause.restaurantId = restaurantId;
    }

    const reviews = await prisma.review.findMany({ 
      where: whereClause,
      include: { response: true } 
    });
    
    const totalReviews = reviews.length;
    const totalResponses = reviews.filter(r => r.response !== null).length;
    const unansweredReviews = totalReviews - totalResponses;
    
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
      : '0';
      
    const responseRate = totalReviews > 0 
      ? ((totalResponses / totalReviews) * 100).toFixed(0) 
      : '0';

    res.json({ totalReviews, totalResponses, unansweredReviews, averageRating, responseRate });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST reply
router.post('/:reviewId/reply', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { responseText } = req.body;
    const vendorId = req.user?.id || 'test-user-001';

    const newResponse = await prisma.reviewResponse.create({
      data: { reviewId, vendorId, responseText }
    });
    res.status(201).json(newResponse);
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ error: 'Failed to submit reply' });
  }
});

// PUT edit reply
router.put('/replies/:replyId', async (req, res) => {
  try {
    const { replyId } = req.params;
    const { responseText } = req.body;
    const updatedResponse = await prisma.reviewResponse.update({
      where: { id: replyId },
      data: { responseText }
    });
    res.json(updatedResponse);
  } catch (error) {
    console.error('Edit reply error:', error);
    res.status(500).json({ error: 'Failed to update reply' });
  }
});

// DELETE reply
router.delete('/replies/:replyId', async (req, res) => {
  try {
    const { replyId } = req.params;
    await prisma.reviewResponse.delete({ where: { id: replyId } });
    res.json({ success: true, message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// POST flag
router.post('/:reviewId/flag', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const vendorId = req.user?.id || 'test-user-001';

    const newFlag = await prisma.reviewFlag.create({
      data: { reviewId, vendorId, reason: reason || 'Inappropriate', status: 'PENDING' }
    });
    res.status(201).json(newFlag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to flag review' });
  }
});

module.exports = router;