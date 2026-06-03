const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  itemId:        { type: String, required: true },
  itemName:      { type: String, required: true },
  quantity:      { type: Number, default: 1 },
  quantityLabel: { type: String, default: '1' },
  unitPrice:     { type: Number, required: true },
  totalPrice:    { type: Number, required: true },
}, { _id: false });

const receiptSchema = new mongoose.Schema({
  storeId:     { type: String, required: true },
  storeName:   { type: String, default: '' },
  userId:      { type: String, default: null },
  receiptDate: { type: String, default: null },
  items:       [receiptItemSchema],
  subtotal:    { type: Number, default: 0 },
  tax:         { type: Number, default: 0 },
  total:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
