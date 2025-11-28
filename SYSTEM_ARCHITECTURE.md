# Study Spots - System Architecture

## Overview
A three-tier web application for discovering and managing study locations. The system connects a responsive frontend with a Node.js/Express backend and cloud services for data persistence and file storage.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ HTML/CSS/JavaScript (ES6 Modules)                       │   │
│  │ • index.html - Form Modal & Card Display                │   │
│  │ • script.js - CRUD Operations & DOM Rendering           │   │
│  │ • upload.js - Image Upload Handler                      │   │
│  │ • style.css - Responsive Grid (3/2/1 columns)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│    (Fetch API) - HTTP Requests (JSON)                           │
│         │                    │                    │              │
└─────────┼────────────────────┼────────────────────┼──────────────┘
          │                    │                    │
          │ CORS Enabled       │ CORS Enabled       │ CORS Enabled
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│           EXPRESS.JS / NODE.JS SERVER (Vercel)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ server.js - Main Application Entry Point                │   │
│  │ • Express initialization                                │   │
│  │ • CORS middleware                                       │   │
│  │ • Static file serving (/public)                        │   │
│  │ • Route mounting                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ routes/api.js - REST API Endpoints (CRUD)               │   │
│  │ • POST /data - Create new study spot                    │   │
│  │ • GET /data - Fetch all study spots (max 100)          │   │
│  │ • GET /data/:id - Fetch specific study spot            │   │
│  │ • PUT /data/:id - Update study spot                    │   │
│  │ • DELETE /data/:id - Delete study spot                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ routes/upload.js - Image Upload API                     │   │
│  │ • POST /api/upload - Upload image to Vercel Blob       │   │
│  │ • DELETE /api/image - Delete image from Vercel Blob    │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                    │                                    │
└─────────┼────────────────────┼────────────────────────────────────┘
          │                    │
          │ Prisma Client      │ Vercel Blob SDK
          │ (MongoDB Protocol) │ (REST API)
          ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD SERVICES (External)                     │
│                                                                   │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │  MongoDB Atlas (Database)    │  │  Vercel Blob Storage     │ │
│  │                              │  │                          │ │
│  │ Collections:                 │  │ Image Storage:           │ │
│  │ • StudySpot Model            │  │ • cafe.jpg               │ │
│  │   - name                     │  │ • library.jpg            │ │
│  │   - address                  │  │ • park.jpg               │ │
│  │   - spotType                 │  │ • co-work.jpg            │ │
│  │   - hasWifi                  │  │ • other.jpg              │ │
│  │   - hasOutlets               │  │ • (user uploads)         │ │
│  │   - hasIndoorSeating         │  │                          │ │
│  │   - hasOutdoorSeating        │  │ Referenced by:           │ │
│  │   - hasRestroom              │  │ imageUrl field in DB     │ │
│  │   - acceptsCreditCard        │  │                          │ │
│  │   - hasFreeParking           │  │ Features:                │ │
│  │   - hasPaidParking           │  │ • Serverless storage     │ │
│  │   - hasNoParking             │  │ • CDN-backed delivery    │ │
│  │   - hours                    │  │ • Token-based auth       │ │
│  │   - phoneNumber              │  │                          │ │
│  │   - links                    │  │                          │ │
│  │   - imageUrl                 │  │                          │ │
│  │   - createdAt                │  │                          │ │
│  │   - updatedAt                │  │                          │ │
│  │                              │  │                          │ │
│  │ Connection:                  │  │ Connection:              │ │
│  │ DATABASE_URL env var         │  │ BLOB_READ_WRITE_TOKEN    │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. **Creating a Study Spot**
```
Frontend (Form Submit)
    ↓ [POST /data - JSON payload]
Express Server (validate & sanitize)
    ↓ [Prisma Client]
MongoDB Atlas (create StudySpot document)
    ↓ [return new document with ID]
Express Server (respond with 201 + data)
    ↓ [JSON response]
Frontend (refresh getData(), render new card)
```

### 2. **Uploading an Image**
```
Frontend (file selected)
    ↓ [FormData with image file]
Express Server (/api/upload)
    ↓ [Vercel Blob SDK - PUT request]
Vercel Blob Storage (store file, return URL)
    ↓ [return blob URL]
Express Server (respond with URL)
    ↓ [JSON with imageUrl]
Frontend (store URL in hidden form field)
    ↓ [imageUrl saved to form for next create/update]
```

### 3. **Fetching All Study Spots**
```
Frontend (page load - getData())
    ↓ [GET /data]
Express Server (Prisma findMany)
    ↓ [MongoDB query]
MongoDB Atlas (return up to 100 documents)
    ↓ [JSON array]
Express Server (respond with 200 + data)
    ↓ [JSON array]
Frontend (loop through, renderItem() for each)
    ↓ [populate #contentArea with 3-column grid]
```

### 4. **Editing a Study Spot**
```
Frontend (click Edit button)
    ↓ [populate form with existing data]
User modifies form
    ↓ [click Save]
Frontend (PUT /data/:id - JSON payload with ID)
    ↓
Express Server (validate & sanitize)
    ↓ [Prisma Client]
MongoDB Atlas (findUnique + update)
    ↓ [return updated document]
Express Server (respond with 200 + data)
    ↓
Frontend (close form, refresh getData())
```

### 5. **Deleting a Study Spot**
```
Frontend (click Delete button)
    ↓ [DELETE /data/:id]
Express Server
    ↓ [if image exists, call Vercel Blob to delete]
Vercel Blob Storage (delete image file)
    ↓ [confirm deletion]
Express Server (Prisma delete)
    ↓ [MongoDB delete operation]
MongoDB Atlas (remove document)
    ↓ [confirm deletion]
Express Server (respond with 200)
    ↓
Frontend (refresh getData(), re-render cards)
```

---

## Technology Stack

### Frontend
- **HTML5** - Semantic markup with form modal and card grid
- **CSS3** - Responsive grid layout (3/2/1 columns), Flexbox, custom fonts
- **JavaScript (ES6+)** - Modules, async/await, Fetch API
- **Libraries**:
  - DOMPurify (XSS prevention for user input)
  - Typekit fonts (rl-horizon, elizeth-condensed)
  - Google Fonts (Cabin)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - HTTP server, routing, middleware
- **Prisma Client** - MongoDB ORM, type-safe queries
- **Vercel Blob SDK** - File storage API client

### Cloud Services
- **MongoDB Atlas** - Hosted NoSQL database (MongoDB 5.x)
- **Vercel Blob** - Serverless file storage
- **Vercel** - Deployment platform (hosting, functions, environment variables)

---

## Environment Variables (Required)

```
DATABASE_URL=mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]?retryWrites=true&w=majority
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_[token]
```

---

## Key Relationships

| Component | Communicates With | Method | Data Format | Purpose |
|-----------|------------------|--------|-------------|---------|
| Frontend (script.js) | Express API | HTTP GET/POST/PUT/DELETE | JSON | CRUD operations |
| Frontend (upload.js) | Express Upload | HTTP POST | FormData | Image upload |
| Express API | MongoDB | Prisma ORM | Query objects | Persist study spots |
| Express Upload | Vercel Blob | SDK REST API | Multipart/form-data | Store images |
| MongoDB | (Prisma query results) | MongoDB Protocol | BSON documents | Data storage |
| Vercel Blob | (CDN) | HTTPS URLs | Binary files | Image delivery |

---

## Security Features

1. **CORS Middleware** - Controls which domains can access the API
2. **XSS Prevention** - DOMPurify sanitizes all user input before rendering
3. **Schema Validation** - Prisma validates all data against schema before saving
4. **Token Authentication** - Vercel Blob uses `BLOB_READ_WRITE_TOKEN` for access control
5. **Environment Variables** - Sensitive credentials stored in Vercel settings, not in code

---

## Deployment Architecture

```
GitHub Repository (main branch)
    ↓ [git push]
Vercel GitHub Integration
    ↓ [automatic deployment on push]
Vercel Platform
    ├─ Builds Node.js server
    ├─ Compiles Prisma Client
    ├─ Serves static files from /public
    └─ Exposes /api endpoints as serverless functions
    ↓
Live URL (https://[project].vercel.app)
    ├─ Frontend files (HTML/CSS/JS)
    ├─ API endpoints
    └─ Environment variables from project settings
```

---

## Performance & Scalability

- **Database**: MongoDB Atlas auto-scales, supports up to 100 records per query
- **Storage**: Vercel Blob provides CDN-backed delivery with automatic optimization
- **Hosting**: Vercel's serverless functions auto-scale based on demand
- **Frontend**: 3-column responsive grid optimized for all screen sizes
- **Image Loading**: Placeholder images per spot type, lazy loading on cards

---

## Error Handling

| Layer | Error Type | Example | Resolution |
|-------|-----------|---------|-----------|
| Frontend | Network error | Failed to fetch | Alert user, log to console |
| Frontend | Validation error | Invalid image size | Show error message |
| Express | Database error | Prisma validation | Return 500 + error details |
| Express | Storage error | Blob upload fails | Return 500 + error details |
| MongoDB | Connection error | Database unavailable | Logs appear in Vercel Functions |
| Vercel Blob | Auth error | Invalid token | Check BLOB_READ_WRITE_TOKEN |

---

## Future Enhancement Opportunities

1. **User Authentication** - Add user login/accounts
2. **Search & Filter** - Filter by spot type, amenities, location
3. **Reviews** - Currently removed, could be re-added
4. **Real-time Updates** - WebSockets for live card updates
5. **Geolocation** - Map integration, distance calculations
6. **Analytics** - Track popular spots, usage patterns
7. **Mobile App** - React Native or Flutter client
8. **Caching** - Redis for frequently accessed data
