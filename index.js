const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ft-manufacturer-house.web.app',
    'https://ft-manufacturer-house.firebaseapp.com'
  ],
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Server is running',
    status: 'OK'
  });
});


// ── JWT Verification Middleware ──────────────────────────────────────────────
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
}

// ── MongoDB Connection ──────────────────────────────────────────────────────
const uri =
  process.env.DB_URI ||
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('ftManufacturerHouse');
    const productsCollection = db.collection('products');
    const reviewsCollection = db.collection('reviews');
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');

    // ── Admin Verification Middleware ──────────────────────────────────────
    // Must be used AFTER verifyJWT so that req.decoded is available
    const verifyAdmin = async (req, res, next) => {
      const requesterEmail = req.decoded.email;
      const user = await usersCollection.findOne({ email: requesterEmail });
      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'Forbidden: admin access required' });
      }
      next();
    };

    // ─────────────────────────────────────────────────────────────────────
    //  PRODUCTS / PARTS  (/purchase)
    // ─────────────────────────────────────────────────────────────────────

    // GET /purchase — list all products
    app.get('/purchase', async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        res.send(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send({ message: 'Failed to fetch products' });
      }
    });

    // GET /purchase/:id — get single product by ID
    app.get('/purchase/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const product = await productsCollection.findOne({ _id: ObjectId(id) });
        if (!product) {
          return res.status(404).send({ message: 'Product not found' });
        }
        res.send(product);
      } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send({ message: 'Failed to fetch product' });
      }
    });

    // POST /purchase — add a product (admin only)
    app.post('/purchase', verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.send(result);
      } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send({ message: 'Failed to add product' });
      }
    });

    // DELETE /purchase/:id — delete a product (admin only)
    app.delete('/purchase/:id', verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        const result = await productsCollection.deleteOne({ _id: ObjectId(id) });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'Product not found' });
        }
        res.send(result);
      } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send({ message: 'Failed to delete product' });
      }
    });

    // ─────────────────────────────────────────────────────────────────────
    //  REVIEWS  (/reviews)
    // ─────────────────────────────────────────────────────────────────────

    // GET /reviews — list all reviews
    app.get('/reviews', async (req, res) => {
      try {
        const reviews = await reviewsCollection.find().toArray();
        res.send(reviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send({ message: 'Failed to fetch reviews' });
      }
    });

    // POST /reviews — add a review (JWT required)
    app.post('/reviews', verifyJWT, async (req, res) => {
      try {
        const review = req.body;
        const result = await reviewsCollection.insertOne(review);
        res.send(result);
      } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).send({ message: 'Failed to add review' });
      }
    });

    // ─────────────────────────────────────────────────────────────────────
    //  ORDERS  (/orders)
    // ─────────────────────────────────────────────────────────────────────

    // GET /orders — list all orders (admin) or filter by customer email
    app.get('/orders', verifyJWT, async (req, res) => {
      try {
        const customerEmail = req.query.customer;
        let query = {};

        if (customerEmail) {
          // If customer query param is present, verify the requester is
          // either the customer themselves or an admin
          const decodedEmail = req.decoded.email;
          if (decodedEmail !== customerEmail) {
            // Check if the requester is an admin
            const requester = await usersCollection.findOne({ email: decodedEmail });
            if (!requester || requester.role !== 'admin') {
              return res.status(403).send({ message: 'Forbidden access' });
            }
          }
          query = { customer: customerEmail };
        } else {
          // No filter — only admins can list all orders
          const decodedEmail = req.decoded.email;
          const requester = await usersCollection.findOne({ email: decodedEmail });
          if (!requester || requester.role !== 'admin') {
            return res.status(403).send({ message: 'Forbidden: admin access required' });
          }
        }

        const orders = await ordersCollection.find(query).toArray();
        res.send(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ message: 'Failed to fetch orders' });
      }
    });

    // POST /orders — create an order (JWT required)
    app.post('/orders', verifyJWT, async (req, res) => {
      try {
        const order = req.body;
        const result = await ordersCollection.insertOne(order);
        res.send(result);
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send({ message: 'Failed to create order' });
      }
    });

    // PATCH /orders/:id — update order status (admin only)
    app.patch('/orders/:id', verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const id = req.params.id;
        const updatedFields = req.body;
        const result = await ordersCollection.updateOne(
          { _id: ObjectId(id) },
          { $set: updatedFields }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Order not found' });
        }
        res.send(result);
      } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).send({ message: 'Failed to update order' });
      }
    });

    // ─────────────────────────────────────────────────────────────────────
    //  USERS  (/users)
    // ─────────────────────────────────────────────────────────────────────

    // GET /users — list all users (admin only)
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.send(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send({ message: 'Failed to fetch users' });
      }
    });

    // PUT /users/admin/:email — make a user admin (admin only)
    // NOTE: This route MUST be defined before PUT /users/:email
    app.put('/users/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const email = req.params.email;
        const result = await usersCollection.updateOne(
          { email },
          { $set: { role: 'admin' } }
        );
        res.send(result);
      } catch (error) {
        console.error('Error making user admin:', error);
        res.status(500).send({ message: 'Failed to update user role' });
      }
    });

    // PUT /users/:email — upsert user and return a JWT token
    app.put('/users/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const user = req.body;
        const filter = { email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };

        const result = await usersCollection.updateOne(filter, updateDoc, options);

        // Sign and return a JWT
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '1d',
        });

        res.send({ result, token });
      } catch (error) {
        console.error('Error upserting user:', error);
        res.status(500).send({ message: 'Failed to upsert user' });
      }
    });

    // GET /admin/:email — check if user is admin
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      try {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email });
        const isAdmin = user?.role === 'admin';
        res.send({ admin: isAdmin });
      } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).send({ message: 'Failed to check admin status' });
      }
    });

    // DELETE /users/:email — delete a user (admin only)
    app.delete('/users/:email', verifyJWT, verifyAdmin, async (req, res) => {
      try {
        const email = req.params.email;
        const result = await usersCollection.deleteOne({ email });
        if (result.deletedCount === 0) {
          return res.status(404).send({ message: 'User not found' });
        }
        res.send(result);
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({ message: 'Failed to delete user' });
      }
    });


  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

run().catch(console.dir);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`FT Manufacturer House listening on port ${port}`);
});