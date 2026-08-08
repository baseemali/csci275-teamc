const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Canadian postal code validation: A1A 1A1 (space optional)
const CANADA_POSTAL_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
const isValidCanadianPostalCode = (postal) => !!postal && CANADA_POSTAL_REGEX.test(postal.trim());

exports.createRestaurant = async (req, res) => {
  try {
    console.log("📥 Received restaurant data from frontend:", req.body);
    
    const { vendorId, name, street, city, zipcode, phone, email, cuisine, priceLevel } = req.body;
    
    if (!vendorId || !name || !street || !city || !zipcode) {
      console.log("⚠️ Validation failed: Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!isValidCanadianPostalCode(zipcode)) {
      console.log("⚠️ Invalid postal code:", zipcode);
      return res.status(400).json({
        error: "Invalid Canadian postal code. Expected format: A1A 1A1 (e.g., V6B 5K8)"
      });
    }

    if (zipcode && !isValidCanadianPostalCode(zipcode)) {
      return res.status(400).json({
        error: "Invalid Canadian postal code. Expected format: A1A 1A1"
      });
    }

    // --- NEW: Duplicate Detection Check ---
    // We check if a restaurant with the exact same name and address already exists.
    // We use 'insensitive' mode so "Joe's Diner" and "joe's diner" are treated as duplicates.
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        street: { equals: street, mode: 'insensitive' },
        city: { equals: city, mode: 'insensitive' },
        zipcode: { equals: zipcode }
      }
    });

    if (existingRestaurant) {
      console.log("⚠️ Duplicate detected:", name);
      // 409 Conflict is the standard HTTP status for duplicates
      return res.status(409).json({ 
        error: "A restaurant with this name and address already exists.",
        existingId: existingRestaurant.id 
      });
    }
    // ----------------------------------------

    const restaurant = await prisma.restaurant.create({
      data: { vendorId, name, street, city, zipcode, phone, email, cuisine, priceLevel }
    });
    
    console.log("✅ SUCCESS: Restaurant saved to database with ID:", restaurant.id);
    
    res.status(201).json(restaurant);
  } catch (error) {
    console.error("❌ DATABASE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.params.id },
      include: { hours: true, tags: true, vendor: true }
    });
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRestaurantProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, street, city, zipcode } = req.body;

    // Duplicate Detection Check (excluding the current restaurant being edited)
    if (name && street && city && zipcode) {
      const existingRestaurant = await prisma.restaurant.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          street: { equals: street, mode: 'insensitive' },
          city: { equals: city, mode: 'insensitive' },
          zipcode: { equals: zipcode },
          id: { not: id } // Ensure we don't flag the current restaurant as a duplicate of itself
        }
      });

      if (existingRestaurant) {
        return res.status(409).json({
          error: "A restaurant with this name and address already exists.",
          existingId: existingRestaurant.id
        });
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: req.body
    });
    
    res.status(200).json(restaurant);
  } catch (error) {
    console.error("❌ UPDATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.verifyBusiness = async (req, res) => {
  try {
    const { documentUrl } = req.body;
    const verification = await prisma.businessVerification.create({
      data: { restaurantId: req.params.id, documentUrl, status: "PENDING" }
    });
    res.status(201).json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRestaurantVerifications = async (req, res) => {
  try {
    const verifications = await prisma.businessVerification.findMany({
      where: { restaurantId: req.params.id },
      orderBy: { submittedAt: 'desc' }
    });
    res.status(200).json(verifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchRestaurants = async (req, res) => {
  try {
    const { query, cuisine, priceLevel } = req.query;
    const where = {};
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } }
      ];
    }
    if (cuisine) where.cuisine = cuisine;
    if (priceLevel) where.priceLevel = parseInt(priceLevel);

    const restaurants = await prisma.restaurant.findMany({ 
      where, 
      include: { vendor: true, tags: true }, 
      take: 50 
    });
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnclaimedRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { OR: [{ vendorId: null }, { isClaimed: false }] },
      include: { tags: true }, 
      orderBy: { name: 'asc' }
    });
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClaimedRestaurants = async (req, res) => {
  try {
    const { vendorId } = req.query;
    const where = { isClaimed: true };
    if (vendorId) where.vendorId = vendorId;
    
    const restaurants = await prisma.restaurant.findMany({ 
      where, 
      include: { vendor: true, tags: true }, 
      orderBy: { name: 'asc' } 
    });
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/restaurants/suggest
// POST /api/restaurants/suggest
exports.suggestRestaurant = async (req, res) => {
  try {
    // 1. Extract ONLY minimal details
    const { name, street, city, zipcode, priceLevel } = req.body;

    // 2. Validate required minimal fields
    if (!name || !street || !city || !zipcode || !priceLevel) {
      return res.status(400).json({ 
        error: "Name, address (street, city, zipcode), and priceLevel are required." 
      });
    }

    // Ensure priceLevel is a valid integer (1, 2, or 3)
    const validPriceLevel = parseInt(priceLevel);
    if (isNaN(validPriceLevel) || validPriceLevel < 1 || validPriceLevel > 3) {
      return res.status(400).json({ error: "priceLevel must be 1, 2, or 3." });
    }

    // 3. Duplicate Detection (Case-insensitive on name and address)
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        street: { equals: street, mode: 'insensitive' },
        city: { equals: city, mode: 'insensitive' },
        zipcode: { equals: zipcode }
      }
    });

    if (existingRestaurant) {
      return res.status(409).json({ 
        error: "This restaurant already exists in our database." 
      });
    }

    // 4. Create as UNCLAIMED with minimal details (defaults for the rest)
    const restaurant = await prisma.restaurant.create({
      data: { 
        vendorId: null,          
        isClaimed: false,        
        name, 
        street, 
        city, 
        zipcode, 
        priceLevel: validPriceLevel,
        // Auto-fill missing required DB columns
        cuisine: "Unknown",      
        phone: "N/A",            
        email: "N/A",            
        description: "Suggested by a user." 
      }
    });
    
    res.status(201).json({ 
      message: "Restaurant suggested successfully.",
      restaurant 
    });
  } catch (error) {
    console.error("Database error on suggest:", error);
    res.status(500).json({ error: error.message });
  }
};