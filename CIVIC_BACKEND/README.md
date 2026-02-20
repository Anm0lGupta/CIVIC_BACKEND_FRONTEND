# Civic Mirror — Backend

Reddit-powered civic complaint ingestion backend for the Civic Mirror platform.

---

## What This Does

When someone posts on Reddit:
> "Massive pothole in Janakpuri near District Centre Delhi"

This backend automatically:
1. **Fetches** the post via Reddit API
2. **Classifies** it as PWD department, High urgency
3. **Geocodes** Janakpuri → lat: 28.6219, lng: 77.0910
4. **Creates** complaint record CMR-2026-XXXX
5. **Saves** to Supabase database
6. **Emails** MCD West Zone with full complaint details
7. **Notifies** the citizen with their complaint ID

---

## Folder Structure

```
civic-mirror-backend/
├── src/
│   ├── index.js                    ← Entry point, starts Express server
│   ├── routes/
│   │   ├── reddit.js               ← GET /api/reddit/fetch
│   │   └── complaint.js            ← POST /api/complaint/register
│   ├── services/
│   │   ├── redditService.js        ← Reddit API calls (OAuth + public)
│   │   ├── classifierService.js    ← AI department + urgency detection
│   │   ├── locationService.js      ← Location extraction + geocoding
│   │   ├── emailService.js         ← Nodemailer emails
│   │   ├── smsService.js           ← Twilio SMS
│   │   └── databaseService.js      ← Supabase CRUD
│   ├── data/
│   │   └── municipalDirectory.js   ← Delhi MCD zone contacts
│   └── middleware/
│       └── errorHandler.js         ← Global error handling
├── .env.example                    ← Copy this to .env and fill in
├── package.json
└── README.md
```

---

## Setup Guide

### Step 1 — Install dependencies
```bash
cd civic-mirror-backend
npm install
```

### Step 2 — Configure environment variables
```bash
cp .env.example .env
# Edit .env and fill in each value (see guide below)
```

### Step 3 — Set up Supabase database
1. Go to [app.supabase.com](https://app.supabase.com) → New Project
2. Open **SQL Editor** and run this:

```sql
CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  complaint_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT,
  department_full TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open',
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  source TEXT DEFAULT 'reddit',
  source_handle TEXT,
  reddit_id TEXT UNIQUE,
  reddit_permalink TEXT,
  ai_confidence INTEGER,
  citizen_email TEXT,
  citizen_phone TEXT,
  authority_email_sent BOOLEAN DEFAULT false,
  citizen_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Copy your **Project URL** and **Service Role Key** (Settings → API) to `.env`

### Step 4 — Set up Reddit API
1. Go to [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
2. Click **Create App** → Choose **script** type
3. Name it "CivicMirror", redirect URI: `http://localhost:3001`
4. Copy **client ID** (under app name) and **client secret** to `.env`

### Step 5 — Set up Gmail (for emails)
1. Go to your Google Account → Security → 2-Step Verification (enable it)
2. Then go to Security → App Passwords → Generate a 16-character password
3. Put that password (not your Gmail password) in `EMAIL_PASS` in `.env`

### Step 6 — Run the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:3001`

---

## API Endpoints

### Health Check
```
GET /health
```
```json
{ "status": "ok", "service": "Civic Mirror Backend" }
```

---

### Fetch Reddit Posts (Preview — no DB save)
```
GET /api/reddit/fetch?keyword=pothole
GET /api/reddit/fetch?keyword=water leak&subreddit=delhi&limit=15
GET /api/reddit/fetch?keyword=garbage&multi=true
```

**Response:**
```json
{
  "success": true,
  "keyword": "pothole",
  "totalFetched": 15,
  "civicCount": 11,
  "rejectedCount": 4,
  "complaints": [
    {
      "redditId": "abc123",
      "redditTitle": "Big pothole near Janakpuri metro station",
      "department": "PWD",
      "departmentFull": "Public Works Department",
      "urgency": "high",
      "aiConfidence": 85,
      "extractedLocation": "Janakpuri",
      "redditPermalink": "https://reddit.com/r/delhi/..."
    }
  ]
}
```

---

### Register a Complaint (Full Pipeline)
```
POST /api/complaint/register
Content-Type: application/json
```

**Request body:**
```json
{
  "redditId": "abc123",
  "title": "Massive pothole in Janakpuri near District Centre Delhi",
  "body": "The pothole is at least 2 feet deep. Several bikes have fallen. Exists for 3 months.",
  "author": "delhi_resident",
  "permalink": "https://reddit.com/r/delhi/comments/abc123",
  "citizenEmail": "citizen@gmail.com",
  "citizenPhone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "complaintId": "CMR-2026-4271",
  "department": "PWD",
  "departmentFull": "Public Works Department",
  "urgency": "high",
  "aiConfidence": 85,
  "location": "Janakpuri, Delhi",
  "lat": 28.6219,
  "lng": 77.091,
  "municipalAuthority": "MCD West Zone",
  "authorityEmailSent": true,
  "citizenEmailSent": true,
  "citizenSMSSent": false,
  "trackingUrl": "/track?id=CMR-2026-4271"
}
```

---

### Batch Process (Fetch + Register multiple posts)
```
POST /api/complaint/batch-process
Content-Type: application/json

{ "keyword": "pothole", "subreddit": "delhi", "limit": 10 }
```

---

## Works Without Configuration

Every external service has a fallback:

| Service | Without Config |
|---------|---------------|
| Reddit API | Falls back to public endpoint (no OAuth) |
| Supabase | Logs to console instead of saving |
| Email (Gmail) | Logs email content to console |
| SMS (Twilio) | Logs SMS content to console |

So you can **demo the full flow** even with zero credentials configured.

---

## Connecting to Your React Frontend

In your React app, replace the hardcoded `mockComplaints` with API calls:

```javascript
// Fetch Reddit posts to preview before registering
const response = await fetch(
  `http://localhost:3001/api/reddit/fetch?keyword=pothole`
)
const data = await response.json()
// data.complaints is an array ready to display in SocialFeed.jsx

// Register a specific post as a complaint
const reg = await fetch(`http://localhost:3001/api/complaint/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    redditId: post.redditId,
    title: post.redditTitle,
    body: post.redditBody,
    author: post.redditAuthor,
    permalink: post.redditPermalink,
    citizenEmail: "user@example.com"
  })
})
const result = await reg.json()
// result.complaintId = "CMR-2026-XXXX"
```

---

## Built for CODEZEN 2026 · Team DataCrafters
