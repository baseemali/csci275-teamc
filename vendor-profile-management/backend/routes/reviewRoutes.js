const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        response: true,
        flags: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    console.error('Reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({ include: { response: true } });
    const totalReviews = reviews.length;
    const totalResponses = reviews.filter(r => r.response !== null).length;
    const unansweredReviews = totalReviews - totalResponses;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;
    const responseRate = totalReviews > 0 
      ? ((totalResponses / totalReviews) * 100).toFixed(0) 
      : 0;

    res.json({ totalReviews, totalResponses, unansweredReviews, averageRating, responseRate });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

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