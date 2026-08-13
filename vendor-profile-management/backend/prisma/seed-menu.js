const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to build a full Unsplash URL
const img = (id) => `https://images.unsplash.com/${id}?w=600&q=60&auto=format&fit=crop`;

// Dish templates keyed by cuisine (with a fallback)
const MENU_TEMPLATES = {
  Italian: [
    { name: 'Bruschetta al Pomodoro', description: 'Toasted ciabatta, heirloom tomatoes, basil, garlic, balsamic glaze', price: 8.5, category: 'Appetizers', imageUrl: img('photo-1572695157366-5e585ab2b69f') },
    { name: 'Spaghetti Carbonara', description: 'Guanciale, egg yolk, pecorino romano, cracked black pepper', price: 16.0, category: 'Main Course', imageUrl: img('photo-1612874742237-6526221588e3') },
    { name: 'Margherita Pizza', description: 'San Marzano tomatoes, fior di latte, fresh basil, olive oil', price: 14.5, category: 'Main Course', imageUrl: img('photo-1513104890138-7c749659a591') },
    { name: 'Tiramisu', description: 'Espresso-soaked savoiardi, mascarpone cream, cocoa', price: 7.5, category: 'Desserts', imageUrl: img('photo-1571877227200-a0d98ea607e9') },
  ],
  Japanese: [
    { name: 'Tonkotsu Ramen', description: 'Rich pork broth, chashu, soft egg, nori, scallions', price: 15.0, category: 'Main Course', imageUrl: img('photo-1569718212165-3a8278d5f624') },
    { name: 'Salmon Nigiri Set', description: 'Eight pieces of hand-pressed salmon nigiri', price: 18.0, category: 'Main Course', imageUrl: img('photo-1579871494447-9811cf80d66c') },
    { name: 'Gyoza (6 pcs)', description: 'Pan-seared pork dumplings with ponzu dipping sauce', price: 8.0, category: 'Appetizers', imageUrl: img('photo-1496116218417-1a781b1c416c') },
    { name: 'Matcha Soft Serve', description: 'Ceremonial-grade matcha soft serve in a waffle cone', price: 5.5, category: 'Desserts', imageUrl: img('photo-1563805042-7684c019e1cb') },
  ],
  Seafood: [
    { name: 'Grilled Atlantic Salmon', description: 'Charred salmon, lemon butter, seasonal vegetables', price: 24.0, category: 'Main Course', imageUrl: img('photo-1467003909585-2f8a72700288') },
    { name: 'Crispy Fish & Chips', description: 'Beer-battered cod, hand-cut fries, house tartar', price: 16.5, category: 'Main Course', imageUrl: img('photo-1579205631316-18a9f34d3a5e') },
    { name: 'Clam Chowder', description: 'Creamy New England chowder with sourdough croutons', price: 9.0, category: 'Appetizers', imageUrl: img('photo-1547592166-23ac45744acd') },
  ],
  Indian: [
    { name: 'Butter Chicken', description: 'Tandoori chicken in a silky tomato-makhani sauce, naan', price: 17.0, category: 'Main Course', imageUrl: img('photo-1585937421612-70a008356fbe') },
    { name: 'Samosa Chaat', description: 'Crisp samosas, chickpeas, yogurt, tamarind, chutney', price: 8.0, category: 'Appetizers', imageUrl: img('photo-1601050690597-df0568f70950') },
    { name: 'Mango Lassi', description: 'Chilled yogurt smoothie with alphonso mango', price: 5.0, category: 'Drinks', imageUrl: img('photo-1553530666-ba11a7da3888') },
  ],
  Mexican: [
    { name: 'Street Tacos (3 pcs)', description: 'Carne asada, cilantro, onion, salsa verde on corn tortillas', price: 12.0, category: 'Main Course', imageUrl: img('photo-1565299624246-b28f40a0ae38') },
    { name: 'Guacamole & Chips', description: 'Hand-mashed avocado, lime, jalapeño, warm tortilla chips', price: 7.5, category: 'Appetizers', imageUrl: img('photo-1600891964092-4316c288032e') },
    { name: 'Churros', description: 'Cinnamon-sugar churros with chocolate dipping sauce', price: 6.5, category: 'Desserts', imageUrl: img('photo-1624371414361-e670edf4898d') },
  ],
  default: [
    { name: 'House Burger', description: 'Double smash patty, cheddar, pickles, secret sauce, brioche', price: 14.0, category: 'Main Course', imageUrl: img('photo-1568901346375-23c9450c58cd') },
    { name: 'Garden Salad', description: 'Mixed greens, cherry tomato, cucumber, citrus vinaigrette', price: 9.0, category: 'Appetizers', imageUrl: img('photo-1512621776951-a57141f2eefd') },
    { name: 'Hand-Cut Fries', description: 'Crispy fries with rosemary salt', price: 5.5, category: 'Sides', imageUrl: img('photo-1573080496219-bb080dd4f877') },
    { name: 'Chocolate Cake', description: 'Flourless chocolate cake, berry compote', price: 7.0, category: 'Desserts', imageUrl: img('photo-1578985545062-69928b1d9587') },
  ],
};

async function main() {
  console.log('️  Seeding menu items...');

  const restaurants = await prisma.restaurant.findMany();
  let total = 0;

  for (const rest of restaurants) {
    // Idempotent: clear existing menu for this restaurant first
    await prisma.menuItem.deleteMany({ where: { restaurantId: rest.id } });

    const template = MENU_TEMPLATES[rest.cuisine] || MENU_TEMPLATES.default;

    await prisma.menuItem.createMany({
      data: template.map((item) => ({ ...item, restaurantId: rest.id })),
    });

    total += template.length;
    console.log(`  ✅ ${rest.name} (${rest.cuisine}): ${template.length} items`);
  }

  console.log(`\n🎉 Done! Seeded ${total} menu items across ${restaurants.length} restaurants.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });