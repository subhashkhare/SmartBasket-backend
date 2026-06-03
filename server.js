const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { router: authRoutes } = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const priceRoutes = require('./routes/prices');
const receiptRoutes = require('./routes/receipts');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Origins allowed to call this API
const ALLOWED_ORIGINS = [
  'https://smart-basket-frontend.vercel.app', // production frontend
  // localhost ports are only reachable from a developer's own machine,
  // never from a real user's browser hitting the production API
  'http://localhost:8082',  // vite dev server (frontend)
  'http://localhost:5173',
  'http://localhost:5174',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and listed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

let mongoConnectPromise = null;
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoConnectPromise) {
    return mongoConnectPromise;
  }

  mongoConnectPromise = mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    .then((connection) => {
      console.log('Connected to MongoDB Atlas');
      return connection;
    })
    .catch((err) => {
      mongoConnectPromise = null;
      throw err;
    });

  return mongoConnectPromise;
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/receipts', receiptRoutes);


const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;