require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Routes (Only Team C routes - No Auth/Login)
const vendorRoutes = require('./routes/vendorRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reviews', reviewRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('✅ Vendor & Restaurant Profile API (Team C) is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});