const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  prices: {
    type: Map,
    of: Number,
    required: true,
  },
  storeNames: {
    type: Map,
    of: String,
    default: {},
  },
  userId: {
    type: String,
    default: null,
  },
  receiptDate: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Price', priceSchema);