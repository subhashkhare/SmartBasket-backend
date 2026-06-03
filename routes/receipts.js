const express = require('express');
const Receipt = require('../models/Receipt');
const Price = require('../models/Price');
const { auth } = require('./auth');

const router = express.Router();

function buildItemId(itemName) {
  const normalized = String(itemName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return normalized ? `item-${normalized}` : `item-${Date.now()}`;
}

// Get receipts (optionally filtered by userId)
router.get('/', async (req, res) => {
  try {
    const query = req.query.userId ? { userId: req.query.userId } : {};
    const receipts = await Receipt.find(query).sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get receipt by ID
router.get('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: 'Receipt not found' });
    res.json(receipt);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save receipt + upsert price catalog
router.post('/', auth, async (req, res) => {
  try {
    const { storeId, storeName, userId, receiptDate, items, subtotal, tax, total } = req.body;

    if (!storeId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'storeId and items are required' });
    }

    // Duplicate check: same store + date already saved
    if (receiptDate) {
      const duplicate = await Receipt.findOne({ storeId, receiptDate });
      if (duplicate) return res.json({ alreadyExists: true, receipt: duplicate });
    }

    // Normalise items — store lowercase, derive itemId
    const normalizedItems = items.map((item) => ({
      itemId:        item.itemId || buildItemId(item.itemName),
      itemName:      String(item.itemName || '').trim().toLowerCase(),
      quantity:      Number(item.quantity) || 1,
      quantityLabel: item.quantityLabel || String(item.quantity || 1),
      unitPrice:     parseFloat(Number(item.unitPrice).toFixed(2)),
      totalPrice:    parseFloat(Number(item.totalPrice).toFixed(2)),
    }));

    // Save the receipt document
    const receipt = await Receipt.create({
      storeId,
      storeName: storeName || '',
      userId: userId || null,
      receiptDate: receiptDate || null,
      items: normalizedItems,
      subtotal: Number(subtotal) || 0,
      tax:      Number(tax)      || 0,
      total:    Number(total)    || 0,
    });

    // Upsert price catalog for each item
    for (const item of normalizedItems) {
      if (!item.itemName || item.unitPrice <= 0) continue;

      const existing = await Price.findOne({ itemId: item.itemId });
      if (!existing) {
        await Price.create({
          itemId:      item.itemId,
          itemName:    item.itemName,
          prices:      { [storeId]: item.unitPrice },
          userId:      userId || null,
          receiptDate: receiptDate || null,
        });
      } else {
        existing.prices.set(storeId, item.unitPrice);
        if (receiptDate) existing.receiptDate = receiptDate;
        await existing.save();
      }
    }

    res.status(201).json({ receipt, updated: normalizedItems.length });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
