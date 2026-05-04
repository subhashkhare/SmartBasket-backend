# Smart Cart Saver Backend

Backend API for the Smart Cart Saver grocery price comparison app.

## Features

- User authentication with phone number and PIN
- Store management
- Price tracking and comparison
- MongoDB Atlas cloud database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

3. Seed the database with mock data:
   ```bash
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get store by ID
- `POST /api/stores` - Create a new store (authenticated)
- `PUT /api/stores/:id` - Update store (authenticated)
- `DELETE /api/stores/:id` - Delete store (authenticated)

### Prices
- `GET /api/prices` - Get all prices
- `GET /api/prices/store/:storeId` - Get prices by store
- `GET /api/prices/:id` - Get price by ID
- `POST /api/prices` - Create a new price (authenticated)
- `PUT /api/prices/:id` - Update price (authenticated)
- `DELETE /api/prices/:id` - Delete price (authenticated)

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing