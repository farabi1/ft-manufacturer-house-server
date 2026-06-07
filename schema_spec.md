# FT Manufacturer House - MongoDB Schema Specification

This document details the formalized MongoDB document schemas for the modernized database layer of the application. Since the backend uses the native MongoDB driver, these schemas serve as structural guides for validation and ingestion.

---

## 1. `products` Collection

Contains all manufacturing tools, industrial equipment, and spare parts available in the catalog.

```json
{
  "_id": "ObjectId",
  "name": "String",
  "category": "String",
  "subCategory": "String",
  "price": "Number",
  "currency": "String",
  "stock": "Number",
  "minOrder": "Number",
  "description": "String",
  "images": ["String"],
  "specifications": {
    "brand": "String",
    "power": "String",
    "weight": "String",
    "dimensions": "String",
    "warranty": "String"
  },
  "isActive": "Boolean",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### Field Definitions & Constraints
* **`name`**: `String` (Required). Unique name of the industrial product.
* **`category`**: `String` (Required). Top-level category for high-level filtering (e.g., `"Power Tools"`, `"CNC Machinery"`).
* **`subCategory`**: `String` (Required). Sub-level category for refined catalog filtering (e.g., `"Drills"`, `"Milling"`).
* **`price`**: `Number` (Required). Unit price of the product (minimum: `0`).
* **`currency`**: `String` (Default: `"USD"`).
* **`stock`**: `Number` (Required). Current inventory count.
* **`minOrder`**: `Number` (Default: `1`). Minimum wholesale order quantity.
* **`description`**: `String` (Required). Detailed description of application and safety specifications.
* **`images`**: `Array of Strings` (Required). URIs or paths to product showcase images.
* **`specifications`**: `Object` (Optional). Key-value pairs for technical specs.
* **`isActive`**: `Boolean` (Default: `true`). Used by administrators to soft-delete/deactivate catalog items.
* **`createdAt` / `updatedAt`**: `ISODate` (Required). Timestamps.

---

## 2. `categories` Collection

Allows the frontend to dynamically populate search dropdowns, sidebar filters, and catalog sections.

```json
{
  "_id": "ObjectId",
  "name": "String",
  "slug": "String",
  "subCategories": ["String"],
  "isActive": "Boolean"
}
```

---

## 3. `users` Collection

Stores account profiles for both industrial buyers and system administrators.

```json
{
  "_id": "ObjectId",
  "email": "String",
  "name": "String",
  "role": "String",
  "phone": "String",
  "address": "String",
  "createdAt": "ISODate"
}
```

### Roles:
- `"buyer"`: Default user role. Can place orders and submit reviews.
- `"admin"`: Full administrative access. Can add/modify/delete products and update order statuses.

---

## 4. `orders` Collection

Tracks purchase transactions, quantities, shipment details, and payment state.

```json
{
  "_id": "ObjectId",
  "productId": "ObjectId",
  "productName": "String",
  "buyerEmail": "String",
  "buyerName": "String",
  "quantity": "Number",
  "unitPrice": "Number",
  "totalPrice": "Number",
  "shippingAddress": "String",
  "phone": "String",
  "status": "String",
  "transactionId": "String",
  "createdAt": "ISODate"
}
```

### Order Statuses:
- `"pending"`: Order created, waiting for payment/verification.
- `"paid"`: Payment confirmed, preparing for shipment.
- `"shipped"`: Dispatched to delivery address.
- `"cancelled"`: Revoked by user or admin.
