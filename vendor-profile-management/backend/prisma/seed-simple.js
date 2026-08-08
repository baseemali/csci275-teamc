const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(' Creating realistic, randomized reviews...');

  // 1. Create our pool of 6 different customers
  const customers = [
    { id: 'customer-001', name: 'Sarah Johnson', email: 'sarah.j@email.com' },
    { id: 'customer-002', name: 'Mike Chen', email: 'mike.chen@email.com' },
    { id: 'customer-003', name: 'Emily Davis', email: 'emily.d@email.com' },
    { id: 'customer-004', name: 'James Wilson', email: 'james.w@email.com' },
    { id: 'customer-005', name: 'Lisa Park', email: 'lisa.park@email.com' },
    { id: 'customer-006', name: 'David Brown', email: 'david.b@email.com' },
  ];

  for (const cust of customers) {
    const existingUser = await prisma.user.findUnique({ where: { id: cust.id } });
    if (!existingUser) {
      await prisma.user.create({
        data: { id: cust.id, email: cust.email, password: 'hashedpassword123', name: cust.name, role: 'CUSTOMER' }
      });
    }
  }

  // 2. Target only our real vendor restaurants
  const restaurants = [
    { id: 'rest-001', name: 'The Old Spaghetti Factory' },
    { id: 'rest-002', name: 'Japadog Yaletown' },
    { id: 'rest-003', name: 'Cardero Brewing Co.' },
    { id: 'rest-004', name: 'Buddha-Full Vegan Kitchen' },
    { id: 'rest-005', name: 'Maple & Sea Chophouse' },
    { id: 'test-restaurant-001', name: 'Test Restaurant' }
  ];

  // 3. Pool of realistic comments
  const commentsPool = [
    "Absolutely loved the atmosphere and the food was incredible!",
    "Great service, but the wait time was a bit long.",
    "Best meal I've had in Vancouver. Highly recommend!",
    "Food was okay, but a bit overpriced for the portion size.",
    "The staff was so friendly and accommodating.",
    "Not what I expected. The dish was a bit too salty.",
    "Will definitely be coming back here with my family.",
    "Amazing flavors! You can tell they use fresh ingredients.",
    "Good value for money. Perfect for a quick lunch.",
    "The view from the table was stunning, and the food matched it."
  ];

  // 4. Clear old reviews to start fresh
  await prisma.reviewResponse.deleteMany({});
  await prisma.review.deleteMany({});
  console.log('🗑️ Cleared old reviews.');

  let totalReviewsCreated = 0;

  // 5. Loop through each restaurant and create a RANDOM number of reviews (1 to 5)
  for (const restaurant of restaurants) {
    const numReviews = Math.floor(Math.random() * 5) + 1; // Random number between 1 and 5
    console.log(`  ➕ Adding ${numReviews} review(s) for: ${restaurant.name}`);

    for (let i = 0; i < numReviews; i++) {
      // Pick a random customer
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      // Pick a random rating (1 to 5)
      const randomRating = Math.floor(Math.random() * 5) + 1;
      // Pick a random comment
      const randomComment = commentsPool[Math.floor(Math.random() * commentsPool.length)];

      await prisma.review.create({
        data: {
          restaurantId: restaurant.id,
          userId: randomCustomer.id,
          rating: randomRating,
          comment: randomComment
        }
      });
      totalReviewsCreated++;
    }
  }

  // 6. Add a couple of replies to make it look active
  const allReviews = await prisma.review.findMany();
  if (allReviews.length > 0) {
    await prisma.reviewResponse.create({
      data: { reviewId: allReviews[0].id, vendorId: 'test-user-001', responseText: 'Thank you for the wonderful feedback! We hope to see you again soon.' }
    });
    if (allReviews.length > 2) {
      await prisma.reviewResponse.create({
        data: { reviewId: allReviews[2].id, vendorId: 'test-user-001', responseText: 'We appreciate your honest review and will work on improving that aspect.' }
      });
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Created ${totalReviewsCreated} total reviews across 6 restaurants.`);
  console.log(`   - Each restaurant has a different number of reviews (1-5).`);
  console.log(`   - Reviews are from different customers with varied ratings.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });