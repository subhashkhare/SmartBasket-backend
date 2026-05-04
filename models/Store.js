const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
  logo: {
    type: String,
    default: '',
  },
  isMembership: {
    type: Boolean,
    default: false,
  },
  chainId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);