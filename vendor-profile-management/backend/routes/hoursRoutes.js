const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET hours for a restaurant
router.get('/', async (req, res) => {
  try {
    const hours = await prisma.restaurantHours.findMany({
      where: { restaurantId: req.params.restaurantId },
    });
    res.json(hours);
  } catch (error) {
    console.error('Error fetching hours:', error);
    res.status(500).json({ error: 'Failed to fetch hours' });
  }
});

// PUT — bulk save (upsert each day)
router.put('/', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { hours } = req.body; // [{ day, openTime, closeTime, isClosed }]

    for (const h of hours) {
      await prisma.restaurantHours.upsert({
        where: { restaurantId_day: { restaurantId, day: h.day } },
        update: {
          openTime: h.isClosed ? null : h.openTime,
          closeTime: h.isClosed ? null : h.closeTime,
          isClosed: !!h.isClosed,
        },
        create: {
          restaurantId,
          day: h.day,
          openTime: h.isClosed ? null : h.openTime,
          closeTime: h.isClosed ? null : h.closeTime,
          isClosed: !!h.isClosed,
        },
      });
    }

    const updated = await prisma.restaurantHours.findMany({ where: { restaurantId } });
    res.json(updated);
  } catch (error) {
    console.error('Error saving hours:', error);
    res.status(500).json({ error: 'Failed to save hours' });
  }
});

module.exports = router;