const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getOrCreateTestVendor = async (req, res) => {
  try {
    // 1. Look for our specific test vendor
    let vendor = await prisma.vendor.findUnique({
      where: { id: "test-vendor-123" }
    });

    if (!vendor) {
      // 2. Look for the test user
      let user = await prisma.user.findUnique({
        where: { id: "test-user-001" }
      });

      // 3. If user doesn't exist, create it with a UNIQUE email
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: "test-user-001",
            email: "test_vendor_123@foodie.com", // Highly unique to prevent conflicts
            password: "hashedpassword123",
            name: "Test Vendor",
            role: "VENDOR"
          }
        });
      }

      // 4. Create the vendor linked to the user
      vendor = await prisma.vendor.create({
        data: {
          id: "test-vendor-123",
          userId: user.id,
          businessName: "Test Business",
          profileCompletion: 10
        }
      });
    }

    res.status(200).json(vendor);
  } catch (error) {
    // This will print the EXACT database error in your terminal if it fails
    console.error("CRITICAL ERROR IN GET TEST VENDOR:", error);
    res.status(500).json({ error: error.message, details: error.meta });
  }
};

exports.getVendorProfile = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: { 
        restaurants: true, 
        notifications: true,
        user: { select: { email: true, name: true } }
      }
    });
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVendorProfile = async (req, res) => {
  try {
    const { 
      businessName, description, businessPhone, businessEmail, 
      website, registrationNumber, registeredAddress 
    } = req.body;

    let completion = 0;
    const fields = [businessName, description, businessPhone, businessEmail, website, registrationNumber, registeredAddress];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    completion = Math.round((filledFields / fields.length) * 100);

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { 
        businessName, 
        description, 
        businessPhone, 
        businessEmail, 
        website, 
        registrationNumber, 
        registeredAddress,
        profileCompletion: completion
      }
    });
    
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVendorRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { vendorId: req.params.vendorId }
    });
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotificationSettings = async (req, res) => {
  try {
    const settings = await prisma.vendorNotification.findUnique({
      where: { vendorId: req.params.id }
    });
    res.status(200).json(settings || { emailAlerts: true, reviewAlerts: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  try {
    const { emailAlerts, reviewAlerts } = req.body;
    const settings = await prisma.vendorNotification.upsert({
      where: { vendorId: req.params.id },
      update: { emailAlerts, reviewAlerts },
      create: { vendorId: req.params.id, emailAlerts, reviewAlerts }
    });
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};