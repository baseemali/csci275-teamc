const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :restaurantId
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all menu items for a specific restaurant
router.get('/', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// POST create a new menu item
router.post('/', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, category, imageUrl } = req.body;
    
    const newItem = await prisma.menuItem.create({
      data: {
        restaurantId,
        name,
        description,
        price: parseFloat(price),
        category: category || 'Main Course',
        imageUrl
      }
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT update a menu item (including toggling availability)
router.put('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, category, imageUrl, isAvailable } = req.body;
    
    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        category,
        imageUrl,
        isAvailable
      }
    });
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE a menu item
router.delete('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    await prisma.menuItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

module.exports = router;