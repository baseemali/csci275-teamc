const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=60&auto=format&fit=crop`;
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

/* ───────────────────────── NEW RESTAURANTS ───────────────────────── */
const NEW_RESTAURANTS = [
  { id: 'rest-101', name: 'Sakura Sushi House', cuisine: 'Japanese', city: 'Vancouver', street: '1288 W Broadway', zipcode: 'V6H 1G4', phone: '(604) 555-0141', email: 'hello@sakurasushi.ca', website: 'https://sakurasushi.example.com', priceLevel: 2, isClaimed: true, description: 'Authentic Edomae-style sushi and hand-rolled ramen in a minimalist, lantern-lit space.', logoUrl: img('photo-1579871494447-9811cf80d66c'), coverUrl: img('photo-1553621042-f6e147245754') },
  { id: 'rest-102', name: 'Bangkok Street Kitchen', cuisine: 'Thai', city: 'Burnaby', street: '4562 Kingsway', zipcode: 'V5H 4J9', phone: '(604) 555-0177', email: 'eat@bangkokstreet.ca', website: 'https://bangkokstreet.example.com', priceLevel: 1, isClaimed: true, description: 'Fiery street-food classics from the stalls of Bangkok — pad thai, curries, and mango sticky rice.', logoUrl: img('photo-1559314809-5d2522f50dd0'), coverUrl: img('photo-1552566626-52f8b828add9') },
  { id: 'rest-103', name: 'Casa del Taco', cuisine: 'Mexican', city: 'Vancouver', street: '789 Commercial Dr', zipcode: 'V5L 3X9', phone: '(604) 555-0122', email: 'hola@casadeltaco.ca', website: 'https://casadeltaco.example.com', priceLevel: 1, isClaimed: true, description: 'Hand-pressed tortillas, slow-braised meats, and salsas made fresh every morning.', logoUrl: img('photo-1565299624246-b28f40a0ae38'), coverUrl: img('photo-1414235077428-338989a2e8c0') },
  { id: 'rest-104', name: 'Spice Route', cuisine: 'Indian', city: 'Surrey', street: '8128 120 St', zipcode: 'V3W 3N2', phone: '(604) 555-0195', email: 'namaste@spiceroute.ca', website: 'https://spiceroute.example.com', priceLevel: 2, isClaimed: true, description: 'Family recipes from Delhi and Hyderabad, tandoor-fired breads, and slow-simmered curries.', logoUrl: img('photo-1585937421612-70a008356fbe'), coverUrl: img('photo-1517248135467-4c7edcad34c4') },
  { id: 'rest-105', name: 'Olive & Vine', cuisine: 'Mediterranean', city: 'Vancouver', street: '2345 W 4th Ave', zipcode: 'V6K 1N6', phone: '(604) 555-0163', email: 'yiasou@oliveandvine.ca', website: 'https://oliveandvine.example.com', priceLevel: 3, isClaimed: true, description: 'Sun-drenched Mediterranean plates — hummus, falafel, grilled halloumi, and coastal wines.', logoUrl: img('photo-1512621776951-a57141f2eefd'), coverUrl: img('photo-1544148103-0773bf10d330') },
  { id: 'rest-106', name: 'Maple & Main Diner', cuisine: 'Canadian', city: 'Richmond', street: '6060 Minoru Blvd', zipcode: 'V6Y 2V7', phone: '(604) 555-0110', email: 'howdy@mapleandmain.ca', website: 'https://mapleandmain.example.com', priceLevel: 2, isClaimed: true, description: 'All-day comfort food — poutine, stacked pancakes, and coffee that never runs dry.', logoUrl: img('photo-1568901346375-23c9450c58cd'), coverUrl: img('photo-1466978913421-dad2ebd01d17') },
];

/* ───────────────────────── MENU TEMPLATES ───────────────────────── */
const MENU = {
  Japanese: [
    { name: 'Tonkotsu Ramen', description: 'Rich pork broth, chashu, soft egg, nori, scallions', price: 15.0, category: 'Main Course', imageUrl: img('photo-1569718212165-3a8278d5f624') },
    { name: 'Salmon Nigiri Set', description: 'Eight pieces of hand-pressed salmon nigiri', price: 18.0, category: 'Main Course', imageUrl: img('photo-1579871494447-9811cf80d66c') },
    { name: 'Gyoza (6 pcs)', description: 'Pan-seared pork dumplings with ponzu', price: 8.0, category: 'Appetizers', imageUrl: img('photo-1496116218417-1a781b1c416c') },
    { name: 'Chicken Katsu Curry', description: 'Crispy katsu, Japanese curry, steamed rice', price: 16.5, category: 'Main Course', imageUrl: img('photo-1546069901-ba9599a7e63c') },
    { name: 'Edamame', description: 'Steamed soybeans with flaky sea salt', price: 5.0, category: 'Appetizers', imageUrl: img('photo-1564834744159-ff0ea41ba4b9') },
    { name: 'Matcha Soft Serve', description: 'Ceremonial-grade matcha in a waffle cone', price: 5.5, category: 'Desserts', imageUrl: img('photo-1563805042-7684c019e1cb') },
  ],
  Thai: [
    { name: 'Pad Thai', description: 'Rice noodles, tamarind, peanuts, lime, bean sprouts', price: 14.0, category: 'Main Course', imageUrl: img('photo-1559314809-5d2522f50dd0') },
    { name: 'Green Curry', description: 'Coconut green curry, Thai eggplant, basil, jasmine rice', price: 15.5, category: 'Main Course', imageUrl: img('photo-1455619452474-d2be8b1e70cd') },
    { name: 'Tom Yum Soup', description: 'Hot & sour soup with shrimp, lemongrass, mushrooms', price: 11.0, category: 'Appetizers', imageUrl: img('photo-1548943487-a2e4e43b4853') },
    { name: 'Mango Sticky Rice', description: 'Sweet coconut sticky rice with ripe mango', price: 7.0, category: 'Desserts', imageUrl: img('photo-1563805042-7684c019e1cb') },
    { name: 'Thai Iced Tea', description: 'Creamy, sweet, and perfectly chilled', price: 4.5, category: 'Drinks', imageUrl: img('photo-1556679343-c7306c1976bc') },
  ],
  Mexican: [
    { name: 'Street Tacos (3 pcs)', description: 'Carne asada, cilantro, onion, salsa verde', price: 12.0, category: 'Main Course', imageUrl: img('photo-1565299624246-b28f40a0ae38') },
    { name: 'Loaded Burrito', description: 'Rice, black beans, cheese, pico, your choice of protein', price: 13.5, category: 'Main Course', imageUrl: img('photo-1626700051175-381d68169526') },
    { name: 'Guacamole & Chips', description: 'Hand-mashed avocado with warm tortilla chips', price: 7.5, category: 'Appetizers', imageUrl: img('photo-1600891964092-4316c288032e') },
    { name: 'Elote', description: 'Grilled corn, chipotle mayo, cotija, lime', price: 6.0, category: 'Sides', imageUrl: img('photo-1551584825-199b6f45c1f8') },
    { name: 'Churros', description: 'Cinnamon sugar with chocolate sauce', price: 6.5, category: 'Desserts', imageUrl: img('photo-1624371414361-e670edf4898d') },
    { name: 'Horchata', description: 'Cinnamon-rice cooler over ice', price: 4.0, category: 'Drinks', imageUrl: img('photo-1541658016709-82535e94bc69') },
  ],
  Indian: [
    { name: 'Butter Chicken', description: 'Tandoori chicken in silky tomato-makhani sauce, naan', price: 17.0, category: 'Main Course', imageUrl: img('photo-1585937421612-70a008356fbe') },
    { name: 'Lamb Biryani', description: 'Fragrant basmati, saffron, caramelized onion, raita', price: 18.5, category: 'Main Course', imageUrl: img('photo-1563379091339-03b21ab4a4f8') },
    { name: 'Samosa Chaat', description: 'Crisp samosas, chickpeas, yogurt, chutneys', price: 8.0, category: 'Appetizers', imageUrl: img('photo-1601050690597-df0568f70950') },
    { name: 'Garlic Naan', description: 'Tandoor-baked, brushed with garlic butter', price: 4.5, category: 'Sides', imageUrl: img('photo-1596040033229-a9821ebd058d') },
    { name: 'Mango Lassi', description: 'Chilled yogurt smoothie with alphonso mango', price: 5.0, category: 'Drinks', imageUrl: img('photo-1553530666-ba11a7da3888') },
  ],
  Mediterranean: [
    { name: 'Falafel Plate', description: 'Crispy falafel, hummus, tabbouleh, pita', price: 14.0, category: 'Main Course', imageUrl: img('photo-1593001872095-78b614f8e2c8') },
    { name: 'Grilled Halloumi', description: 'Seared halloumi, honey, mint, sourdough', price: 12.5, category: 'Appetizers', imageUrl: img('photo-1455619452474-d2be8b1e70cd') },
    { name: 'Greek Salad', description: 'Tomato, cucumber, olives, feta, oregano', price: 11.0, category: 'Appetizers', imageUrl: img('photo-1512621776951-a57141f2eefd') },
    { name: 'Lamb Souvlaki', description: 'Char-grilled lamb, tzatziki, lemon potatoes', price: 19.0, category: 'Main Course', imageUrl: img('photo-1544025162-d76694265947') },
    { name: 'Baklava', description: 'Pistachio, honey, phyllo', price: 6.5, category: 'Desserts', imageUrl: img('photo-1519676867240-f03562e64548') },
  ],
  Canadian: [
    { name: 'Classic Poutine', description: 'Hand-cut fries, cheese curds, rich gravy', price: 11.0, category: 'Main Course', imageUrl: img('photo-1573080496219-bb080dd4f877') },
    { name: 'Stacked Pancakes', description: 'Buttermilk stack, maple syrup, whipped butter', price: 12.5, category: 'Main Course', imageUrl: img('photo-1567620905732-2d1ec7ab7445') },
    { name: 'Diner Burger', description: 'Smash patty, cheddar, pickles, secret sauce', price: 14.0, category: 'Main Course', imageUrl: img('photo-1568901346375-23c9450c58cd') },
    { name: 'Caesar Salad', description: 'Crisp romaine, parmesan, garlic croutons', price: 9.5, category: 'Appetizers', imageUrl: img('photo-1550304943-4f24f54ddde9') },
    { name: 'Bottomless Coffee', description: 'Locally roasted, always hot', price: 3.5, category: 'Drinks', imageUrl: img('photo-1509042239860-f550ce710b93') },
  ],
  default: [
    { name: 'House Burger', description: 'Double smash patty, cheddar, pickles, brioche', price: 14.0, category: 'Main Course', imageUrl: img('photo-1568901346375-23c9450c58cd') },
    { name: 'Garden Salad', description: 'Mixed greens, citrus vinaigrette', price: 9.0, category: 'Appetizers', imageUrl: img('photo-1512621776951-a57141f2eefd') },
    { name: 'Chocolate Cake', description: 'Flourless chocolate, berry compote', price: 7.0, category: 'Desserts', imageUrl: img('photo-1578985545062-69928b1d9587') },
  ],
};

/* ───────────────────────── REVIEW POOLS ───────────────────────── */
const REVIEWER_NAMES = ['Olivia Bennett', 'Noah Carter', 'Emma Sullivan', 'Liam Mitchell', 'Ava Thompson', 'Ethan Rogers', 'Mia Chen', 'Lucas Kim', 'Sofia Rossi', 'Jackson Lee', 'Isabella Martinez', 'Aiden Patel', 'Chloe Dubois', 'Mason Wright', 'Harper Singh', 'Logan Nguyen', 'Aria Johnson', 'Felix Wagner', 'Zoe Anderson', 'Omar Hassan'];

const COMMENTS = [
  { rating: 5, text: 'Absolutely blown away! The flavors were incredible and the service was warm and fast. Already planning my next visit.' },
  { rating: 5, text: 'Hands down the best meal I have had this year. Every dish was perfectly seasoned and beautifully presented.' },
  { rating: 5, text: 'Came here for a birthday dinner and it exceeded every expectation. The staff made us feel like family.' },
  { rating: 4, text: 'Really solid food and friendly staff. It got a little busy at peak hour but it was absolutely worth the wait.' },
  { rating: 4, text: 'Great spot! The menu has lots of variety and everything we tried was tasty. Would recommend.' },
  { rating: 5, text: 'Outstanding from start to finish. Fresh ingredients, generous portions, and a cozy atmosphere.' },
  { rating: 3, text: 'Food was decent but nothing special. Service was friendly though the wait was longer than expected.' },
  { rating: 4, text: 'Delicious food and quick service. Parking can be tricky on weekends, so plan ahead.' },
  { rating: 5, text: 'A hidden gem! The owner greeted us personally and recommended the perfect dishes.' },
  { rating: 2, text: 'Unfortunately not great. My order came out cold and it took forever to get attention.' },
  { rating: 4, text: 'Very good experience overall. Prices are fair for the quality you get.' },
  { rating: 1, text: 'Very disappointing visit. Long wait, unfriendly service, and the order arrived wrong twice.' },
  { rating: 5, text: 'The ambiance is lovely and the food is even better. Perfect date-night spot.' },
  { rating: 3, text: 'Average experience. Some dishes were great, others fell flat. Might try again.' },
];

const RESPONSES = [
  'Thank you so much for the kind words! We cannot wait to welcome you back.',
  'We are thrilled you enjoyed your visit — see you soon!',
  'Thanks for the feedback! We are always working to improve and hope to serve you again.',
  'We are sorry your visit did not meet expectations. Please reach out so we can make it right.',
];

const TAG_POOL = ['Outdoor seating', 'Free Wi-Fi', 'Takeout', 'Delivery', 'Wheelchair accessible', 'Family friendly', 'Vegetarian options', 'Table service', 'Parking available', 'Dog friendly'];

const HOURS_PATTERNS = [
  { Monday: ['09:00', '21:00'], Tuesday: ['09:00', '21:00'], Wednesday: ['09:00', '21:00'], Thursday: ['09:00', '21:00'], Friday: ['09:00', '22:00'], Saturday: ['10:00', '22:00'], Sunday: null },
  { Monday: null, Tuesday: ['11:00', '23:00'], Wednesday: ['11:00', '23:00'], Thursday: ['11:00', '23:00'], Friday: ['11:00', '23:00'], Saturday: ['11:00', '23:00'], Sunday: ['11:00', '22:00'] },
  { Monday: ['08:00', '15:00'], Tuesday: ['08:00', '15:00'], Wednesday: ['08:00', '15:00'], Thursday: ['08:00', '15:00'], Friday: ['08:00', '15:00'], Saturday: ['08:00', '16:00'], Sunday: ['08:00', '16:00'] },
];

/* ───────────────────────── MAIN ───────────────────────── */
async function main() {
  console.log('🌱 Starting rich seed...\n');

  // 1. Vendor
  const vendor = await prisma.vendor.findFirst();
  if (!vendor) throw new Error('No vendor found — run your base seed first!');

  // 2. Ensure reviewer users exist
  let users = [];
  for (let i = 0; i < REVIEWER_NAMES.length; i++) {
    try {
      const u = await prisma.user.upsert({
        where: { id: `user-seed-${String(i + 1).padStart(2, '0')}` },
        update: {},
        create: {
          id: `user-seed-${String(i + 1).padStart(2, '0')}`,
          name: REVIEWER_NAMES[i],
          email: `reviewer${i + 1}@test.com`,
          password: 'Test1234!',
          role: 'CUSTOMER',
        },
      });
      users.push(u);
    } catch (e) {
      console.warn('⚠️  Could not create test users (User model may differ). Falling back to existing users.');
      users = await prisma.user.findMany();
      break;
    }
  }
  if (users.length === 0) console.warn('⚠️  No users available — reviews will be skipped.');

  // 3. Upsert new restaurants
  for (const r of NEW_RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, vendorId: vendor.id },
    });
  }
  console.log(`✅ ${NEW_RESTAURANTS.length} new restaurants ensured`);

  const allRestaurants = await prisma.restaurant.findMany();

  // 4. Richer menus (reset + recreate)
  for (const rest of allRestaurants) {
    await prisma.menuItem.deleteMany({ where: { restaurantId: rest.id } });
    const template = MENU[rest.cuisine] || MENU.default;
    await prisma.menuItem.createMany({
      data: template.map((item, i) => ({
        id: `menu-${rest.id}-${i + 1}`,
        restaurantId: rest.id,
        ...item,
      })),
    });
  }
  console.log(`✅ Menus seeded for ${allRestaurants.length} restaurants`);

  // 5. Hours for every restaurant
  for (let ri = 0; ri < allRestaurants.length; ri++) {
    const pattern = HOURS_PATTERNS[ri % HOURS_PATTERNS.length];
    for (const [day, times] of Object.entries(pattern)) {
      await prisma.restaurantHours.upsert({
        where: { restaurantId_day: { restaurantId: allRestaurants[ri].id, day } },
        update: {},
        create: {
          restaurantId: allRestaurants[ri].id,
          day,
          openTime: times ? times[0] : null,
          closeTime: times ? times[1] : null,
          isClosed: !times,
        },
      });
    }
  }
  console.log('✅ Weekly hours seeded');

  // 6. Features / tags
  for (let ri = 0; ri < allRestaurants.length; ri++) {
    const count = 4 + (ri % 4); // 4-7 tags each
    for (let t = 0; t < count; t++) {
      const name = TAG_POOL[(ri + t) % TAG_POOL.length];
      await prisma.restaurantTag.upsert({
        where: { restaurantId_name: { restaurantId: allRestaurants[ri].id, name } },
        update: {},
        create: { restaurantId: allRestaurants[ri].id, name },
      });
    }
  }
  console.log('✅ Features seeded');

  // 7. Reviews + owner responses
  if (users.length > 0) {
    let revCount = 0;
    for (let ri = 0; ri < allRestaurants.length; ri++) {
      const rest = allRestaurants[ri];
      for (let i = 0; i < 6; i++) {
        const c = COMMENTS[(ri * 3 + i) % COMMENTS.length];
        const user = users[(ri * 5 + i) % users.length];
        const revId = `rev-${rest.id}-${i + 1}`;

        await prisma.review.upsert({
          where: { id: revId },
          update: {},
          create: {
            id: revId,
            restaurantId: rest.id,
            userId: user.id,
            rating: c.rating,
            comment: c.text,
            createdAt: daysAgo(3 + ((ri * 7 + i * 11) % 160)),
          },
        });
        revCount++;

        // Owner response on every 2nd review
        if (i % 2 === 0) {
          try {
            await prisma.reviewResponse.upsert({
              where: { id: `resp-${revId}` },
              update: {},
              create: {
                id: `resp-${revId}`,
                reviewId: revId,
                vendorId: vendor.id,
                responseText: RESPONSES[(ri + i) % RESPONSES.length],
                createdAt: daysAgo(2 + ((ri * 7 + i * 11) % 160)),
              },
            });
          } catch (e) {
            // response model may differ — skip silently after first failure
          }
        }
      }
    }
    console.log(`✅ ${revCount} reviews seeded with responses`);
  }

  console.log('\n🎉 Rich seed complete! Refresh your app to see the new data.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());