# 📚 Vendor, Restaurant & Review Management System

**Team C | CSCI 275 Project**  
**Last Updated:** August 8, 2026 | **Version:** 1.1.0

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Database Schema](#-database-schema)
4. [API Documentation](#-api-documentation)
5. [Error Handling](#-error-handling)
6. [Integration Guide (Team Handoffs)](#-integration-guide-team-handoffs)
7. [Setup & Installation](#-setup--installation)
8. [Project Structure](#-project-structure)

---

## 🌟 Project Overview
This subsystem handles **Vendor Profile, Restaurant Management, and Review Interactions** for the platform. It allows vendors to manage their business details, add and claim restaurants, submit verification documents, and track profile completion. Additionally, it provides a comprehensive **Review Management Dashboard** for vendors to view customer feedback, calculate statistics, reply to reviews, and flag inappropriate content.

**Key Features:**
- ✅ Vendor profile management with auto-calculated completion metrics.
- ✅ Restaurant CRUD operations with strict duplicate prevention.
- ✅ Business verification workflow.
- ✅ **Review Management:** View all reviews, track response rates, reply to customers, and flag inappropriate content.
- ✅ General user restaurant suggestions (minimal details).

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL (via Supabase)
- **Frontend:** React.js, Tailwind CSS, Axios, Lucide Icons, Recharts

---

## 🗄️ Database Schema
Our Prisma schema integrates with Team A (Auth) and manages all core vendor, restaurant, and review interaction models:

| Model | Description | Key Fields |
| :--- | :--- | :--- |
| **User** | *(Team A)* Auth & Roles | `id`, `email`, `password`, `name`, `role` |
| **Vendor** | Business entity linked to User | `id`, `userId`, `businessName`, `profileCompletion`, `verificationStatus` |
| **Restaurant** | Core restaurant data | `id`, `vendorId`, `name`, `street`, `city`, `zipcode`, `isClaimed`, `priceLevel` |
| **RestaurantHours** | Operating hours | `id`, `restaurantId`, `day`, `openTime`, `closeTime` |
| **RestaurantTag** | Searchable tags | `id`, `restaurantId`, `tagName` |
| **BusinessVerification** | Doc submission | `id`, `restaurantId`, `documentUrl`, `status` |
| **VendorNotification** | Alert preferences | `id`, `vendorId`, `emailAlerts`, `reviewAlerts` |
| **Review** | Customer feedback | `id`, `restaurantId`, `userId`, `rating`, `comment`, `createdAt` |
| **ReviewResponse** | Vendor replies to reviews | `id`, `reviewId`, `vendorId`, `responseText`, `createdAt` |
| **ReviewFlag** | Inappropriate content reports | `id`, `reviewId`, `vendorId`, `reason`, `status`, `createdAt` |

---

## 📡 API Documentation

**Base URL:** `http://localhost:5000/api`

### 🔐 Authentication
Handled by **Team A**. All protected endpoints require a JWT token in the header:

```http
Authorization: Bearer <your-jwt-token>
```

---

### 👤 Vendor Endpoints

#### 1. Get Vendor Profile
- **Method:** `GET`
- **Route:** `/vendors/:id`
- **Auth:** Required (Vendor/Admin)
- **Description:** Fetches vendor details, linked restaurants, and notification settings.
- **Response Example:**

```json
{
  "id": "vendor-uuid-123",
  "userId": "user-uuid-456",
  "businessName": "My Restaurant Group",
  "description": "We manage fine dining establishments",
  "businessPhone": "+1-555-1234",
  "businessEmail": "contact@mybusiness.com",
  "website": "https://mybusiness.com",
  "registrationNumber": "REG123456",
  "registeredAddress": "456 Business Ave, City, 12345",
  "profileCompletion": 85,
  "verificationStatus": "VERIFIED",
  "restaurants": [...],
  "createdAt": "2026-08-01T10:00:00Z"
}
```

#### 2. Update Vendor Profile
- **Method:** `PUT`
- **Route:** `/vendors/:id`
- **Auth:** Required (Vendor/Admin - must match ID)
- **Description:** Updates business info and auto-calculates `profileCompletion` %.
- **Request Body:**

```json
{
  "businessName": "Updated Business Name",
  "description": "New description",
  "businessPhone": "+1-555-5678",
  "businessEmail": "new@email.com",
  "website": "https://newsite.com",
  "registrationNumber": "REG789012",
  "registeredAddress": "789 New St, City, 67890"
}
```

#### 3. Get Notification Settings
- **Method:** `GET`
- **Route:** `/vendors/:id/settings`
- **Auth:** Required (Vendor/Admin)
- **Response Example:**

```json
{
  "id": "settings-uuid",
  "vendorId": "vendor-uuid-123",
  "emailAlerts": true,
  "reviewAlerts": true
}
```

#### 4. Update Notification Settings
- **Method:** `PUT`
- **Route:** `/vendors/:id/settings`
- **Auth:** Required (Vendor/Admin)
- **Request Body:**

```json
{
  "emailAlerts": true,
  "reviewAlerts": false
}
```

#### 5. Get Vendor Restaurants
- **Method:** `GET`
- **Route:** `/vendors/:vendorId/restaurants`
- **Auth:** Required (Vendor/Admin)
- **Response Example:**

```json
[
  {
    "id": "restaurant-uuid-1",
    "name": "Joe's Diner",
    "street": "123 Main St",
    "city": "New York",
    "zipcode": "10001",
    "cuisine": "American",
    "priceLevel": 2,
    "isClaimed": true
  }
]
```

---

### 🍽️ Restaurant Endpoints

#### 1. Create Restaurant (Vendor Only)
- **Method:** `POST`
- **Route:** `/restaurants`
- **Auth:** Required (Vendor/Admin)
- **Description:** Creates a claimed restaurant. **Includes duplicate prevention.**
- **Request Body:**

```json
{
  "vendorId": "vendor-uuid-123",
  "name": "Joe's Diner",
  "street": "123 Main St",
  "city": "New York",
  "zipcode": "10001",
  "phone": "+1-555-1234",
  "email": "joes@diner.com",
  "cuisine": "American",
  "priceLevel": 2,
  "description": "Classic American diner"
}
```

- **Success Response:** `201 Created`
- **Error Responses:** `400 Bad Request` (Missing fields), `409 Conflict` (Duplicate name+address).

#### 2. Get Restaurant Profile
- **Method:** `GET`
- **Route:** `/restaurants/:id`
- **Auth:** None (Public)
- **Description:** Retrieve detailed restaurant information including hours, tags, and verifications.

#### 3. Update Restaurant Profile
- **Method:** `PUT`
- **Route:** `/restaurants/:id`
- **Auth:** Required (Vendor/Admin - must own restaurant)
- **Request Body:** (Any fields from create endpoint)

```json
{
  "name": "Joe's Famous Diner",
  "phone": "+1-555-9999",
  "priceLevel": 3
}
```

#### 4. Submit Business Verification
- **Method:** `POST`
- **Route:** `/restaurants/:id/verification`
- **Auth:** Required (Vendor/Admin - must own restaurant)
- **Request Body:**

```json
{
  "documentUrl": "https://storage.example.com/license.pdf"
}
```

- **Response Example:**

```json
{
  "id": "verification-uuid",
  "restaurantId": "restaurant-uuid",
  "documentUrl": "https://storage.example.com/license.pdf",
  "status": "PENDING",
  "submittedAt": "2026-08-07T14:30:00Z"
}
```

#### 5. Get Restaurant Verifications
- **Method:** `GET`
- **Route:** `/restaurants/:id/verifications`
- **Auth:** Required (Vendor/Admin - must own restaurant)
- **Response Example:**

```json
[
  {
    "id": "verification-uuid-1",
    "documentUrl": "https://...",
    "status": "APPROVED",
    "submittedAt": "2026-08-01T10:00:00Z"
  }
]
```

#### 6. Search Restaurants (Public)
- **Method:** `GET`
- **Route:** `/restaurants/search`
- **Auth:** None (Public)
- **Query Parameters:**
  - `query` (optional) - Search term (name, city)
  - `cuisine` (optional) - Filter by cuisine type
  - `priceLevel` (optional) - Filter by price (1, 2, or 3)
- **Example Request:** `GET /restaurants/search?query=pizza&cuisine=Italian&priceLevel=2`

#### 7. Get Unclaimed Restaurants
- **Method:** `GET`
- **Route:** `/restaurants/unclaimed`
- **Auth:** Required (Vendor/Admin)
- **Description:** Retrieve restaurants not yet claimed by vendors (suggested by users).

#### 8. Get Claimed Restaurants
- **Method:** `GET`
- **Route:** `/restaurants/claimed`
- **Auth:** Required (Vendor/Admin)
- **Query Parameters:** `vendorId` (optional) - Filter by specific vendor.

#### 9. Suggest Restaurant (General User)
- **Method:** `POST`
- **Route:** `/restaurants/suggest`
- **Auth:** None (Public/Guest)
- **Description:** Allows guests to add missing restaurants with **minimal details**. Saves as `isClaimed: false`.
- **Request Body:**

```json
{
  "name": "New Spot",
  "street": "456 Suggestion Ave",
  "city": "Chicago",
  "zipcode": "60601",
  "priceLevel": 2
}
```

- **Success Response:** `201 Created`
- **Error Responses:** `400 Bad Request` (Missing fields), `409 Conflict` (Duplicate).

---

### ⭐ Review Management Endpoints

#### 1. Get All Reviews
- **Method:** `GET`
- **Route:** `/reviews`
- **Auth:** Required (Vendor/Admin)
- **Description:** Fetches all reviews, including nested `response` and `flags` data, and basic user info.
- **Response Example:**

```json
[
  {
    "id": "review-uuid-1",
    "restaurantId": "restaurant-uuid-1",
    "rating": 5,
    "comment": "Amazing pasta and great service!",
    "createdAt": "2026-08-07T10:00:00Z",
    "user": { "name": "Happy Customer", "email": "customer@test.com" },
    "response": { "responseText": "Thank you so much!", "createdAt": "..." },
    "flags": []
  }
]
```

#### 2. Get Review Statistics
- **Method:** `GET`
- **Route:** `/reviews/statistics`
- **Auth:** Required (Vendor/Admin)
- **Description:** Calculates dashboard metrics for the vendor.
- **Response Example:**

```json
{
  "totalReviews": 15,
  "totalResponses": 10,
  "unansweredReviews": 5,
  "averageRating": "4.2",
  "responseRate": "67"
}
```

#### 3. Submit a Reply to a Review
- **Method:** `POST`
- **Route:** `/reviews/:reviewId/reply`
- **Auth:** Required (Vendor/Admin)
- **Request Body:**

```json
{
  "responseText": "Thank you for your feedback! We are working on it."
}
```

- **Success Response:** `201 Created` with the new `ReviewResponse` object.

#### 4. Flag a Review as Inappropriate
- **Method:** `POST`
- **Route:** `/reviews/:reviewId/flag`
- **Auth:** Required (Vendor/Admin)
- **Request Body:**

```json
{
  "reason": "Spam or inappropriate language"
}
```

- **Success Response:** `201 Created` with the new `ReviewFlag` object (status defaults to `PENDING`).

---

## ⚠️ Error Handling

All API errors follow a consistent format:

```json
{
  "error": "Descriptive error message"
}
```

### Common HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| `200` | OK | Successful GET/PUT request |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Missing required fields, invalid data |
| `401` | Unauthorized | No token provided, invalid token |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (restaurant already exists) |
| `500` | Internal Server Error | Database error, server crash |

---

## 🔧 Integration Guide (Team Handoffs)

This section contains the exact code changes needed to integrate with **Team A (Authentication)** once their system is ready.

### 1. Frontend API Interceptor (`frontend/src/services/api.js`)
Update the Axios interceptors to handle Team A's JWT and 401 redirects:

```javascript
// Request: Attach Team A's token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Or document.cookie if they use httpOnly
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: Redirect to Team A's login on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'http://localhost:3000/login'; // Team A's URL
    }
    return Promise.reject(error);
  }
);
```

### 2. Protected Routing (`frontend/src/App.jsx`)
Ensure only Vendors/Admins can access Team C's dashboard:

```javascript
const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="http://localhost:3000/login" replace />;
  
  const user = JSON.parse(userStr);
  if (user.role !== 'VENDOR' && user.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};
```

### 3. Logout Logic (`frontend/src/components/Layout.jsx`)
Clear session and redirect to Team A:

```javascript
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'http://localhost:3000/login'; 
};
```

### 4. Database Relations
- **Reviews & Rating System:** The `Review` model is already linked to `Restaurant` via `restaurantId`. You can query `prisma.restaurant.findUnique({ include: { reviews: true } })`.
- **Menus Management System:** When ready, we will add a `MenuItem` model linked to `restaurantId`.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL (Supabase)

### Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
# Add DATABASE_URL and JWT_SECRET to your .env file

# 4. Sync database schema
npx prisma db push

# 5. (Optional) Seed test data (Vendor, Restaurant, Reviews)
node prisma/seed-merged.js

# 6. Start server
npm run dev
```

### Frontend Setup

```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## 📁 Project Structure

```text
backend/
├── controllers/         # Business logic (vendor, restaurant)
├── routes/              # Express route definitions
│   ├── vendorRoutes.js
│   ├── restaurantRoutes.js
│   └── reviewRoutes.js  # ⭐ NEW: Review management APIs
├── prisma/              # Schema.prisma & migrations
│   └── seed-merged.js   # ⭐ NEW: Test data seeder
├── middleware/          # Auth guards (if needed locally)
├── .env                 # Environment variables
└── server.js            # App entry point

frontend/
├── src/
│   ├── components/      # Layout, UI elements, RoleSwitcher.jsx ⭐
│   ├── pages/           # Dashboard, Profiles, Verification, ReviewManagement.jsx ⭐
│   ├── services/        # api.js (Axios config)
│   └── App.jsx          # React router + protected routes
└── package.json
```

---

## 📞 Support & Troubleshooting
- **500 Errors:** Check the backend terminal for Prisma/SQL errors.
- **401 Errors:** Ensure Team A's token is correctly stored in `localStorage`.
- **409 Errors:** Duplicate restaurant detected. Check name and address casing.

**Maintained by:** Team C - Vendor, Restaurant & Review Management
