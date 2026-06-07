const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10}$/, 'Phone number must be a valid US 10-digit number'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, 'Email must be valid'],
  },
  pin: {
    type: String,
    required: true,
    validate: {
      validator: function(pin) {
        // PIN format should only be validated when the field is being set/changed.
        // Existing stored values are bcrypt hashes and should not be re-validated as 4 digits.
        if (!this.isModified('pin')) return true;
        return /^\d{4}$/.test(pin);
      },
      message: 'PIN must be exactly 4 digits',
    },
  },
  preferredStore: {
    type: String,
    default: null,
  },
  zipCode: {
    type: String,
    default: null,
    match: [/^\d{5}(?:-\d{4})?$/, 'ZIP code must be valid US format'],
  },
  lastScannedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Hash PIN before saving
userSchema.pre('save', async function() {
  if (!this.isModified('pin')) return;
  this.pin = await bcrypt.hash(this.pin, 12);
});

// Compare PIN
userSchema.methods.comparePin = async function(candidatePin) {
  return await bcrypt.compare(candidatePin, this.pin);
};

module.exports = mongoose.model('User', userSchema);