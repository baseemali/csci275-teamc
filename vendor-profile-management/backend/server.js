require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Routes (Only Team C routes - No Auth/Login)
const vendorRoutes = require('./routes/vendorRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const menuRoutes = require('./routes/menuRoutes');
const hoursRoutes = require('./routes/hoursRoutes');
const tagsRoutes = require('./routes/tagsRoutes');

const app = express();

// Middleware
//app.use(cors());
app.use(cors({
  origin: [
    'http://localhost:5173',
    /^https:\/\/.*\.onrender\.com$/,   // allows frontend + backend Render URLs
  ],
  credentials: true
}));
app.use(express.json());

// Mount Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/restaurants/:restaurantId/menu', menuRoutes);
app.use('/api/restaurants/:restaurantId/hours', hoursRoutes);
app.use('/api/restaurants/:restaurantId/tags', tagsRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('✅ Vendor & Restaurant Profile API (Team C) is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));