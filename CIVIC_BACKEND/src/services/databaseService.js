// src/services/databaseService.js
// Supabase integration for storing complaints
//
// Supabase is a free PostgreSQL database with a REST API.
// Free tier: 500MB storage, unlimited API calls, 2 projects.
//
// Setup:
// 1. Go to app.supabase.com → New Project
// 2. Go to SQL Editor → run the CREATE TABLE query below
// 3. Copy your Project URL and Service Role Key to .env
//
// ─── RUN THIS IN SUPABASE SQL EDITOR TO CREATE THE TABLE ──────────────────────
//
// CREATE TABLE complaints (
//   id SERIAL PRIMARY KEY,
//   complaint_id TEXT UNIQUE NOT NULL,
//   title TEXT NOT NULL,
//   description TEXT,
//   department TEXT,
//   department_full TEXT,
//   urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')),
//   status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
//   location TEXT,
//   lat DOUBLE PRECISION,
//   lng DOUBLE PRECISION,
//   source TEXT DEFAULT 'reddit',
//   source_handle TEXT,
//   reddit_id TEXT UNIQUE,
//   reddit_permalink TEXT,
//   ai_confidence INTEGER,
//   citizen_email TEXT,
//   citizen_phone TEXT,
//   authority_email_sent BOOLEAN DEFAULT false,
//   citizen_notified BOOLEAN DEFAULT false,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Enable Row Level Security (optional but recommended for production)
// ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
//
// ─────────────────────────────────────────────────────────────────────────────

const { createClient } = require("@supabase/supabase-js")

let supabase = null

/**
 * Gets the Supabase client, creating it on first call.
 * Uses the Service Role Key (bypasses Row Level Security — safe for backend only).
 */
function getSupabase() {
  if (supabase) return supabase

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    console.warn("⚠️  Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.")
    return null
  }

  supabase = createClient(url, key)
  return supabase
}

/**
 * Inserts a new complaint into the database.
 * Returns the inserted record, or null if DB is not configured.
 *
 * @param {object} complaint - Full complaint object
 * @returns {object|null} The inserted complaint record
 */
async function insertComplaint(complaint) {
  const db = getSupabase()

  // If no DB configured, log and return the complaint as-is (demo mode)
  if (!db) {
    console.log("💾 [DB MOCK] Complaint would be saved:", complaint.complaintId)
    return complaint
  }

  // Map our JS object to the DB column names (snake_case)
  const record = {
    complaint_id: complaint.complaintId,
    title: complaint.title,
    description: complaint.description,
    department: complaint.department,
    department_full: complaint.departmentFull,
    urgency: complaint.urgency,
    status: "open",
    location: complaint.location,
    lat: complaint.lat,
    lng: complaint.lng,
    source: complaint.source || "reddit",
    source_handle: complaint.sourceHandle,
    reddit_id: complaint.redditId,
    reddit_permalink: complaint.redditPermalink,
    ai_confidence: complaint.aiConfidence,
    citizen_email: complaint.citizenEmail,
    citizen_phone: complaint.citizenPhone,
    authority_email_sent: false,
    citizen_notified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await db
    .from("complaints")
    .insert([record])
    .select()
    .single()

  if (error) {
    // Handle duplicate Reddit post (unique constraint on reddit_id)
    if (error.code === "23505") {
      console.log(`ℹ️  Duplicate complaint skipped: ${complaint.redditId}`)
      return null
    }
    console.error("❌ DB insert error:", error.message)
    throw new Error(`Database error: ${error.message}`)
  }

  console.log(`💾 Complaint saved to DB: ${complaint.complaintId}`)
  return data
}

/**
 * Checks if a Reddit post has already been processed.
 * Used to prevent duplicate complaints from the same post.
 *
 * @param {string} redditId - The Reddit post ID
 * @returns {boolean} true if already exists
 */
async function complaintExists(redditId) {
  const db = getSupabase()
  if (!db) return false

  const { data, error } = await db
    .from("complaints")
    .select("complaint_id")
    .eq("reddit_id", redditId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = "no rows found" — that's expected when it doesn't exist
    console.error("DB lookup error:", error.message)
    return false
  }

  return !!data
}

/**
 * Updates a complaint after emails have been sent.
 *
 * @param {string} complaintId - Our CMR-XXXX ID
 * @param {object} updates - Fields to update
 */
async function updateComplaint(complaintId, updates) {
  const db = getSupabase()
  if (!db) return

  const { error } = await db
    .from("complaints")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("complaint_id", complaintId)

  if (error) {
    console.error(`DB update error for ${complaintId}:`, error.message)
  }
}

/**
 * Fetches all complaints (for the frontend to display).
 * Used by the GET /api/complaint/all route.
 *
 * @param {number} limit - Max number of records to return
 * @returns {Array} Array of complaint records
 */
async function getAllComplaints(limit = 50) {
  const db = getSupabase()
  if (!db) return []

  const { data, error } = await db
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("DB fetch error:", error.message)
    return []
  }

  return data || []
}

module.exports = {
  insertComplaint,
  complaintExists,
  updateComplaint,
  getAllComplaints,
}
