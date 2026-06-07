# ft-manufacturer-house-server

## Overview

`ft-manufacturer-house-server` is the **backend API** for the *FT Manufacturer House* web application. It provides a RESTful interface for managing:
- **Products** (parts for purchase)
- **Reviews**
- **Orders**
- **Users** (authentication & admin management)

The server is built with **Node.js**, **Express**, and **MongoDB**. JWT authentication secures protected routes, and role‑based checks enforce admin‑only actions.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Server](#running-the-server)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Database Schema Overview](#database-schema-overview)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

---

### Prerequisites
- **Node.js** (v18 or later) – <https://nodejs.org/en/download/>
- **npm** (comes with Node) or **yarn** if preferred.
- **MongoDB** Atlas cluster (or local MongoDB instance).
- **Git** – for version control.

---

### Installation
```bash
# Clone the repository (if not already cloned)
git clone https://github.com/yourusername/ft-manufacturer-house.git
cd ft-manufacturer-house/ft-manufacturer-house-server

# Install dependencies
npm install
```

---

### Configuration
Create a `.env` file in the root of this folder (a template is provided as `.env.example`). Required variables:
```
# Server
PORT=5000

# JWT secret for signing tokens
ACCESS_TOKEN_SECRET=your_secret_key_here

# MongoDB connection – you can use Atlas connection string or local URI
DB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
DB_USER=your_mongo_user
DB_PASS=your_mongo_password
```

> **Note**: Never commit your `.env` file. It is listed in `.gitignore`.

---

### Running the Server
```bash
# Development (auto‑restart on changes)
npm run dev   # if a dev script is defined, otherwise use nodemon

# Production
npm start
```
The server will listen on `http://localhost:<PORT>` (default `5000`).

---

### API Endpoints
All routes are prefixed with `/` unless otherwise noted. JSON request/response bodies are used.

#### Products (`/purchase`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/purchase` | List all products | ❌ | ❌ |
| GET | `/purchase/:id` | Get a single product by ID | ❌ | ❌ |
| POST | `/purchase` | Add a new product | ✅ | ✅ |
| DELETE | `/purchase/:id` | Delete a product | ✅ | ✅ |

#### Reviews (`/reviews`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reviews` | List all reviews | ❌ |
| POST | `/reviews` | Add a review (JWT required) | ✅ |

#### Orders (`/orders`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/orders` | List orders (admin) or filter by `customer` query param | ✅ | ✅ (when no filter) |
| POST | `/orders` | Create an order | ✅ | ❌ |
| PATCH | `/orders/:id` | Update order status (admin only) | ✅ | ✅ |

#### Users (`/users`)
| Method | Endpoint | Description | Auth | Admin |
|--------|----------|-------------|------|-------|
| GET | `/users` | List all users | ✅ | ✅ |
| PUT | `/users/:email` | Upsert user; returns JWT token | ❌ | ❌ |
| PUT | `/users/admin/:email` | Promote user to admin | ✅ | ✅ |
| GET | `/admin/:email` | Check if a user is admin | ✅ | ❌ |
| DELETE | `/users/:email` | Delete a user | ✅ | ✅ |

#### Authentication Helpers
- `POST /login` (not in current code) – you can implement a login route that issues a JWT using the same `ACCESS_TOKEN_SECRET`.

---

### Authentication & Authorization
- **JWT** is expected in the `Authorization` header as `Bearer <token>`.
- Middleware `verifyJWT` validates the token and attaches decoded payload to `req.decoded`.
- Admin routes additionally use `verifyAdmin` which checks `req.decoded.email` against the `users` collection for a `role: 'admin'` entry.

---

### Database Schema Overview
| Collection | Sample Fields |
|------------|--------------|
| `products` | `{ _id, name, price, description, imageUrl, ... }` |
| `reviews`  | `{ _id, productId, rating, comment, userId, createdAt }` |
| `orders`   | `{ _id, customer, items: [{ productId, quantity }], status, createdAt }` |
| `users`    | `{ _id, email, name, role (admin|user), ... }` |

---

### Testing
You can write integration tests using **Jest** and **Supertest**. Example script (add to `package.json`):
```json
"scripts": {
  "test": "jest"
}
```
Create a `tests/` folder and mock the MongoDB connection with `mongodb-memory-server` for isolated tests.

---

### Deployment
1. **Firebase Hosting + Cloud Functions** – Deploy as a Cloud Function using `firebase deploy --only functions`.
2. **Heroku / Render / Railway** – Set environment variables in the platform dashboard and run `npm start`.
3. **Docker** – Example `Dockerfile`:
```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "index.js"]
```
Build and push to your container registry, then run.

---

### Troubleshooting
- **MongoDB connection errors** – Verify `DB_URI`, `DB_USER`, and `DB_PASS` are correct and the IP whitelist includes your server.
- **401 Unauthorized** – Ensure the `Authorization` header is present and the token is not expired.
- **Port already in use** – Change the `PORT` in `.env`.
- **CORS issues** – The server already uses the `cors` package with default settings; adjust `app.use(cors({ origin: 'your‑frontend‑url' }))` if needed.

---

### License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.
