const express = require('express');
const Price = require('../models/Price');
const { auth } = require('./auth');

const router = express.Router();

// Get all prices (optionally filtered by userId)
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    const query = userId ? { userId } : {};
    const prices = await Price.find(query);
    res.json(prices);
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get prices by store
router.get('/store/:storeId', async (req, res) => {
  try {
    const fieldName = `prices.${req.params.storeId}`;
    const prices = await Price.find({ [fieldName]: { $exists: true } });
    res.json(prices);
  } catch (error) {
    console.error('Get prices by store error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get price by ID
router.get('/:id', async (req, res) => {
  try {
    const price = await Price.findById(req.params.id);
    if (!price) {
      return res.status(404).json({ message: 'Price not found' });
    }
    res.json(price);
  } catch (error) {
    console.error('Get price by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create price
router.post('/', auth, async (req, res) => {
  try {
    const { itemId, itemName, prices, userId } = req.body;
    const price = new Price({
      itemId,
      itemName,
      prices,
      userId: userId || null,
    });
    await price.save();
    res.status(201).json(price);
  } catch (error) {
    console.error('Create price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update price
router.put('/:id', auth, async (req, res) => {
  try {
    const { itemId, itemName, prices, userId } = req.body;
    const price = await Price.findByIdAndUpdate(
      req.params.id,
      { itemId, itemName, prices, userId: userId || null },
      { new: true }
    );
    if (!price) {
      return res.status(404).json({ message: 'Price not found' });
    }
    res.json(price);
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete price
router.delete('/:id', auth, async (req, res) => {
  try {
    const price = await Price.findByIdAndDelete(req.params.id);
    if (!price) {
      return res.status(404).json({ message: 'Price not found' });
    }
    res.json({ message: 'Price deleted' });
  } catch (error) {
    console.error('Delete price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;