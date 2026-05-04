const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  evaluateRegistrationForAutoApproval,
  evaluateLoginForAutoApproval,
} = require('../lib/registrationPolicy');
const { sendWelcomeNotifications } = require('../lib/notifications');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, email, pin, preferredStore, zipCode } = req.body;

    const approval = evaluateRegistrationForAutoApproval({
      phoneNumber,
      email,
      pin,
      zipCode,
    });

    if (!approval.approved) {
      return res.status(400).json({ message: approval.errorMessage });
    }

    const existingUser = await User.findOne({
      $or: [
        { phoneNumber: approval.normalizedPhoneNumber },
        { email: approval.normalizedEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Phone number or email already registered' });
    }

    const user = new User({
      phoneNumber: approval.normalizedPhoneNumber,
      email: approval.normalizedEmail,
      pin,
      preferredStore,
      zipCode: approval.normalizedZipCode || null,
    });
    await user.save();

    // Send welcome notifications
    await sendWelcomeNotifications(user.phoneNumber, user.email);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        preferredStore: user.preferredStore,
        zipCode: user.zipCode,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, pin } = req.body;

    const approval = evaluateLoginForAutoApproval({ phoneNumber, pin });
    if (!approval.approved) {
      return res.status(400).json({ message: approval.errorMessage });
    }

    const user = await User.findOne({ phoneNumber: approval.normalizedPhoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        preferredStore: user.preferredStore,
        zipCode: user.zipCode,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Update profile (PIN and/or preferredStore)
router.patch('/profile', auth, async (req, res) => {
  try {
    const { pin, preferredStore } = req.body;
    const updates = {};

    if (pin !== undefined) {
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
      }
      updates.pin = pin; // pre-save hook will hash it
    }

    if (preferredStore !== undefined) {
      updates.preferredStore = String(preferredStore).trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, updates);
    await user.save();

    res.json({
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        preferredStore: user.preferredStore,
        zipCode: user.zipCode,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error?.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0];
      return res.status(400).json({ message: firstError?.message || 'Invalid profile data' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, auth };