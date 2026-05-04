const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Store = require('./models/Store');
const Price = require('./models/Price');
const User = require('./models/User');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing data for a clean seed run.
    await Store.deleteMany({});
    await Price.deleteMany({});
    await User.deleteMany({});

    // 3 sample stores
    const stores = [
      {
        name: 'Walmart Supercenter',
        address: '1600 Saratoga Ave, San Jose, CA',
        zipCode: '95129',
        lat: 37.2935,
        lng: -121.9886,
        chainId: 'walmart',
        logo: 'https://logo.clearbit.com/walmart.com',
        isMembership: false,
      },
      {
        name: 'Target',
        address: '1811 Hillsdale Ave, San Jose, CA',
        zipCode: '95124',
        lat: 37.2603,
        lng: -121.8739,
        chainId: 'target',
        logo: 'https://logo.clearbit.com/target.com',
        isMembership: false,
      },
      {
        name: 'Costco Wholesale',
        address: '5301 Almaden Expy, San Jose, CA',
        zipCode: '95118',
        lat: 37.2531,
        lng: -121.8726,
        chainId: 'costco',
        logo: 'https://logo.clearbit.com/costco.com',
        isMembership: true,
      },
    ];

    const createdStores = await Store.insertMany(stores);
    const storePriceMapTemplate = {
      [createdStores[0]._id.toString()]: 0,
      [createdStores[1]._id.toString()]: 0,
      [createdStores[2]._id.toString()]: 0,
    };

    // 2 sample users
    const users = [
      {
        phoneNumber: '4085551001',
        email: 'alex.carter@example.com',
        pin: '1234',
        preferredStore: 'Walmart Supercenter',
        zipCode: '95129',
      },
      {
        phoneNumber: '4085551002',
        email: 'maya.lee@example.com',
        pin: '5678',
        preferredStore: 'Costco Wholesale',
        zipCode: '95118',
      },
    ];

    await User.insertMany(users);

    // 5 items with prices from 3 stores
    const prices = [
      {
        itemId: 'ITEM-001',
        itemName: 'Milk 1 Gallon',
        prices: {
          ...storePriceMapTemplate,
          [createdStores[0]._id.toString()]: 3.49,
          [createdStores[1]._id.toString()]: 3.69,
          [createdStores[2]._id.toString()]: 3.39,
        },
      },
      {
        itemId: 'ITEM-002',
        itemName: 'Bread Whole Wheat',
        prices: {
          ...storePriceMapTemplate,
          [createdStores[0]._id.toString()]: 2.99,
          [createdStores[1]._id.toString()]: 3.19,
          [createdStores[2]._id.toString()]: 2.79,
        },
      },
      {
        itemId: 'ITEM-003',
        itemName: 'Eggs Dozen',
        prices: {
          ...storePriceMapTemplate,
          [createdStores[0]._id.toString()]: 4.49,
          [createdStores[1]._id.toString()]: 4.79,
          [createdStores[2]._id.toString()]: 4.19,
        },
      },
      {
        itemId: 'ITEM-004',
        itemName: 'Bananas 1 lb',
        prices: {
          ...storePriceMapTemplate,
          [createdStores[0]._id.toString()]: 0.69,
          [createdStores[1]._id.toString()]: 0.79,
          [createdStores[2]._id.toString()]: 0.65,
        },
      },
      {
        itemId: 'ITEM-005',
        itemName: 'Rice 5 lb',
        prices: {
          ...storePriceMapTemplate,
          [createdStores[0]._id.toString()]: 7.99,
          [createdStores[1]._id.toString()]: 8.49,
          [createdStores[2]._id.toString()]: 7.59,
        },
      },
    ];

    await Price.insertMany(prices);

    console.log('Database seeded successfully with 2 users, 3 stores, and 5 items');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();