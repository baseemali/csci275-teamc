const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with reviews for all restaurants...');

  // Create test customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      id: 'test-customer-001',
      email: 'customer@test.com',
      password: 'hashedpassword123',
      name: 'Happy Customer',
      role: 'CUSTOMER'
    }
  });

  // Get ALL existing restaurants from database
  const allRestaurants = await prisma.restaurant.findMany();
  
  if (allRestaurants.length === 0) {
    console.log('⚠️ No restaurants found in database. Please add restaurants first.');
    return;
  }

  console.log(`✅ Found ${allRestaurants.length} restaurants in database`);

  // Create reviews for different restaurants
  const reviews = [];
  
  // Create 2-3 reviews for each restaurant
  for (let i = 0; i < allRestaurants.length; i++) {
    const restaurant = allRestaurants[i];
    
    // Create 2 reviews per restaurant
    const review1 = await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        userId: customer.id,
        rating: Math.floor(Math.random() * 3) + 3, // Random rating 3-5
        comment: `Great experience at ${restaurant.name}!`
      }
    });
    
    reviews.push(review1);

    const review2 = await prisma.review.create({
      data: {
        restaurantId: restaurant.id,
        userId: customer.id,
        rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5
        comment: `Visited ${restaurant.name} - ${['Amazing food!', 'Good service', 'Nice atmosphere', 'Would recommend', 'Excellent!'][Math.floor(Math.random() * 5)]}`
      }
    });
    
    reviews.push(review2);
  }

  // Create a reply to the first review
  if (reviews.length > 0) {
    await prisma.reviewResponse.create({
      data: {
        reviewId: reviews[0].id,
        vendorId: 'test-user-001',
        responseText: 'Thank you for your feedback! We appreciate your visit.'
      }
    });
  }

  console.log('✅ Seeding complete!');
  console.log(`  - Created ${reviews.length} reviews across ${allRestaurants.length} restaurants`);
  console.log(`  - Created 1 reply`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });