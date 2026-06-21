const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock MongoDB before importing app
jest.mock('mongodb', () => {
  const mockProducts = [
    { _id: '628b0821568fa05ef41a27bb', name: 'Drill Machine', price: 150, category: 'Tools' }
  ];
  const mockReviews = [
    { _id: '628b0821568fa05ef41a27bc', name: 'John Doe', rating: 5, comment: 'Great product!' }
  ];

  const mtoArray = jest.fn().mockImplementation(function() {
    return Promise.resolve(mockProducts);
  });
  const mfind = jest.fn().mockReturnValue({ toArray: mtoArray });
  const mfindOne = jest.fn().mockResolvedValue({ email: 'admin@admin.com', role: 'admin' });
  const mCollection = jest.fn().mockReturnValue({
    find: mfind,
    findOne: mfindOne,
    insertOne: jest.fn().mockResolvedValue({ acknowledged: true, insertedId: 'mockId' }),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
  });
  const mDb = jest.fn().mockReturnValue({
    collection: mCollection
  });
  const mConnect = jest.fn().mockResolvedValue({});
  
  class MockMongoClient {
    constructor() {
      this.connect = mConnect;
      this.db = mDb;
    }
  }

  return {
    MongoClient: MockMongoClient,
    ServerApiVersion: { v1: '1' },
    ObjectId: (id) => id
  };
});

// Import the app
const { app } = require('../index');

describe('FT Manufacturer House API Endpoints', () => {
  
  describe('GET /', () => {
    it('should return server status OK', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Server is running',
        status: 'OK'
      });
    });
  });

  describe('GET /purchase (Products)', () => {
    it('should return list of products', async () => {
      const res = await request(app).get('/purchase');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  describe('GET /reviews (Reviews)', () => {
    it('should return list of reviews', async () => {
      const res = await request(app).get('/reviews');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Protected Routes Security', () => {
    it('should return 401 for GET /orders without token', async () => {
      const res = await request(app).get('/orders');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized access');
    });

    it('should return 401 for POST /create-payment-intent without token', async () => {
      const res = await request(app)
        .post('/create-payment-intent')
        .send({ price: 100 });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized access');
    });
  });
});
