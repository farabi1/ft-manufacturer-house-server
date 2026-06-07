const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load environment connection string
const uri =
  process.env.DB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8uuumgc.mongodb.net/?retryWrites=true&w=majority`;

if (!uri) {
  console.error('Error: MongoDB connection URI is missing from env variables.');
  process.exit(1);
}

// Load seed data from json
const seedDataPath = path.join(__dirname, 'seed_data.json');
if (!fs.existsSync(seedDataPath)) {
  console.error(`Error: Seed data file not found at ${seedDataPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Successfully connected to cluster.');

    const db = client.db('ftManufacturerHouse');

    // 1. Seed Products
    if (data.products && data.products.length > 0) {
      console.log('Dropping existing "products" collection...');
      await db.collection('products').deleteMany({});
      
      // Add Timestamps
      const now = new Date();
      const productsToInsert = data.products.map(p => ({
        ...p,
        createdAt: now,
        updatedAt: now
      }));

      console.log(`Inserting ${productsToInsert.length} products...`);
      await db.collection('products').insertMany(productsToInsert);
      console.log('Seeded products.');
    }

    // 2. Seed Categories
    if (data.categories && data.categories.length > 0) {
      console.log('Dropping existing "categories" collection...');
      await db.collection('categories').deleteMany({});
      console.log(`Inserting ${data.categories.length} categories...`);
      await db.collection('categories').insertMany(data.categories);
      console.log('Seeded categories.');
    }

    // 3. Seed Users
    if (data.users && data.users.length > 0) {
      console.log('Dropping existing "users" collection...');
      await db.collection('users').deleteMany({});
      console.log(`Inserting ${data.users.length} users...`);
      await db.collection('users').insertMany(data.users);
      console.log('Seeded users.');
    }

    // 4. Seed Reviews
    if (data.reviews && data.reviews.length > 0) {
      console.log('Dropping existing "reviews" collection...');
      await db.collection('reviews').deleteMany({});
      console.log(`Inserting ${data.reviews.length} reviews...`);
      await db.collection('reviews').insertMany(data.reviews);
      console.log('Seeded reviews.');
    }

    console.log('🎉 Database seeding completed successfully.');
  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

seedDatabase();
