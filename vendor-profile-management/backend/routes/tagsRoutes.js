const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all tags for a restaurant
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.restaurantTag.findMany({
      where: { restaurantId: req.params.restaurantId },
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// POST a new tag (idempotent — skips if already exists)
router.post('/', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Tag name required' });

    // Check for duplicate (case-insensitive)
    const existing = await prisma.restaurantTag.findFirst({
      where: { restaurantId, name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) return res.json(existing);

    const tag = await prisma.restaurantTag.create({
      data: { restaurantId, name: trimmed },
    });
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// DELETE a tag
router.delete('/:tagId', async (req, res) => {
  try {
    await prisma.restaurantTag.delete({ where: { id: req.params.tagId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;