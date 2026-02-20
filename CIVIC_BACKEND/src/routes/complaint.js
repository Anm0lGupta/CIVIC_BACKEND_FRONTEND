// src/routes/complaint.js
// POST /api/complaint/register — The full pipeline in one route
//
// This is where everything connects:
// Reddit post → Classify → Geocode → Save to DB → Email authority → Notify citizen
//
// GET /api/complaint/all — Returns all complaints from the database

const express = require("express")
const { v4: uuidv4 } = require("uuid")
const { classifyComplaint } = require("../services/classifierService")
const { extractAndGeocode } = require("../services/locationService")
const { getMunicipalContact } = require("../data/municipalDirectory")
const { sendAuthorityEmail, sendCitizenConfirmation } = require("../services/emailService")
const { sendCitizenSMS } = require("../services/smsService")
const { insertComplaint, complaintExists, updateComplaint, getAllComplaints } = require("../services/databaseService")

const router = express.Router()

/**
 * Generates a unique Civic Mirror complaint ID.
 * Format: CMR-2026-XXXX where XXXX is a random 4-digit number.
 */
function generateComplaintId() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `CMR-2026-${num}`
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaint/register
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Registers a complaint from a Reddit post.
 * Runs the full pipeline: classify → geocode → save → email → notify
 *
 * Request body:
 * {
 *   redditId: "abc123",
 *   title: "Massive pothole in Janakpuri near District Centre",
 *   body: "The pothole is huge and has caused multiple accidents...",
 *   author: "delhi_resident_99",
 *   permalink: "https://www.reddit.com/r/delhi/...",
 *   createdAt: "2026-01-15T10:30:00Z",
 *   citizenEmail: "user@gmail.com",      // optional
 *   citizenPhone: "+919876543210",        // optional
 * }
 *
 * Response:
 * {
 *   success: true,
 *   complaintId: "CMR-2026-1234",
 *   department: "PWD",
 *   urgency: "high",
 *   location: "Janakpuri",
 *   lat: 28.6219,
 *   lng: 77.0910,
 *   municipalAuthority: "MCD West Zone",
 *   authorityEmailSent: true,
 *   citizenNotified: true,
 * }
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      redditId,
      title,
      body = "",
      author = "anonymous",
      permalink = "",
      createdAt,
      citizenEmail,
      citizenPhone,
    } = req.body

    // ── STEP 1: Validate required fields ──────────────────────────────────────
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: "title is required (min 5 characters)" })
    }

    // ── STEP 2: Check for duplicates ──────────────────────────────────────────
    if (redditId) {
      const exists = await complaintExists(redditId)
      if (exists) {
        return res.status(409).json({
          error: "This Reddit post has already been processed",
          redditId
        })
      }
    }

    console.log(`\n📋 Registering complaint: "${title.slice(0, 50)}..."`)

    // ── STEP 3: AI Classification ──────────────────────────────────────────────
    console.log("   Step 1/6: Classifying complaint...")
    const classification = classifyComplaint(title, body)

    // Block non-civic posts at the API level too
    if (!classification.isCivic) {
      return res.status(422).json({
        error: "This post does not appear to be a civic complaint",
        reason: classification.reason,
        suggestion: "Only posts about potholes, water, electricity, garbage etc. are accepted"
      })
    }

    // ── STEP 4: Location Extraction + Geocoding ────────────────────────────────
    console.log("   Step 2/6: Extracting and geocoding location...")
    const fullText = `${title} ${body}`
    const locationData = await extractAndGeocode(fullText)

    // ── STEP 5: Build the complaint record ────────────────────────────────────
    console.log("   Step 3/6: Building complaint record...")
    const complaintId = generateComplaintId()
    const complaint = {
      complaintId,
      title: title.trim(),
      description: body.trim() || title.trim(),
      department: classification.department,
      departmentFull: classification.departmentFull,
      urgency: classification.urgency,
      aiConfidence: classification.confidence,
      status: "open",
      location: `${locationData.localityName}, Delhi`,
      lat: locationData.lat,
      lng: locationData.lng,
      source: "reddit",
      sourceHandle: author ? `u/${author}` : null,
      redditId: redditId || null,
      redditPermalink: permalink || null,
      citizenEmail: citizenEmail || null,
      citizenPhone: citizenPhone || null,
      timestamp: createdAt || new Date().toISOString(),
    }

    // ── STEP 6: Save to database ──────────────────────────────────────────────
    console.log("   Step 4/6: Saving to database...")
    await insertComplaint(complaint)

    // ── STEP 7: Get municipal authority contact ───────────────────────────────
    console.log("   Step 5/6: Looking up municipal authority...")
    const municipalContact = getMunicipalContact(
      locationData.localityName,
      classification.department
    )

    // ── STEP 8: Send emails (in parallel for speed) ───────────────────────────
    console.log("   Step 6/6: Sending notifications...")

    // Run all notifications concurrently — don't await one before starting next
    const [authorityEmailResult, citizenEmailResult, citizenSMSResult] = await Promise.allSettled([

      // Email the municipal corporation
      sendAuthorityEmail(complaint, municipalContact, permalink),

      // Email the citizen (only if they provided email)
      citizenEmail
        ? sendCitizenConfirmation(citizenEmail, complaint)
        : Promise.resolve({ success: false, reason: "No citizen email provided" }),

      // SMS the citizen (only if they provided phone)
      citizenPhone
        ? sendCitizenSMS(citizenPhone, complaint)
        : Promise.resolve({ success: false, reason: "No citizen phone provided" }),
    ])

    // Extract results (Promise.allSettled never throws — it always resolves)
    const authorityEmailSent = authorityEmailResult.value?.success || false
    const citizenEmailSent = citizenEmailResult.value?.success || false
    const citizenSMSSent = citizenSMSResult.value?.success || false

    // Update DB with notification statuses
    await updateComplaint(complaintId, {
      authority_email_sent: authorityEmailSent,
      citizen_notified: citizenEmailSent || citizenSMSSent,
    })

    // ── STEP 9: Return success response ──────────────────────────────────────
    console.log(`✅ Complaint registered: ${complaintId}\n`)

    res.status(201).json({
      success: true,
      complaintId,

      // Classification results
      department: classification.department,
      departmentFull: classification.departmentFull,
      urgency: classification.urgency,
      aiConfidence: classification.confidence,

      // Location
      location: complaint.location,
      lat: complaint.lat,
      lng: complaint.lng,
      geocoded: locationData.geocoded,

      // Authority
      municipalAuthority: municipalContact.municipalBody,
      municipalZone: municipalContact.zone,

      // Notification status
      authorityEmailSent,
      citizenEmailSent,
      citizenSMSSent,

      // Useful for frontend
      timestamp: complaint.timestamp,
      trackingUrl: `/track?id=${complaintId}`,
    })

  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaint/all
// Returns all saved complaints (for the frontend dashboard)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/all", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const complaints = await getAllComplaints(limit)

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    })
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaint/batch-process
// Fetches Reddit posts AND registers them all in one call.
// This is the "full automation" endpoint — one call does everything.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/batch-process", async (req, res, next) => {
  try {
    const { keyword = "pothole", subreddit = "delhi", limit = 10 } = req.body

    const { fetchRedditPosts } = require("../services/redditService")
    const posts = await fetchRedditPosts(keyword, subreddit, Math.min(limit, 20))

    const results = {
      processed: 0,
      registered: 0,
      rejected: 0,
      duplicates: 0,
      complaints: [],
    }

    // Process posts one by one (sequential to respect Nominatim rate limit)
    for (const post of posts) {
      results.processed++

      // Classify first — skip non-civic immediately without geocoding
      const classification = classifyComplaint(post.title, post.body)
      if (!classification.isCivic) {
        results.rejected++
        continue
      }

      // Check duplicate
      if (post.redditId) {
        const exists = await complaintExists(post.redditId)
        if (exists) {
          results.duplicates++
          continue
        }
      }

      // Full pipeline
      const fullText = `${post.title} ${post.body}`
      const locationData = await extractAndGeocode(fullText)
      const complaintId = generateComplaintId()
      const municipalContact = getMunicipalContact(locationData.localityName, classification.department)

      const complaint = {
        complaintId,
        title: post.title,
        description: post.body || post.title,
        department: classification.department,
        departmentFull: classification.departmentFull,
        urgency: classification.urgency,
        aiConfidence: classification.confidence,
        status: "open",
        location: `${locationData.localityName}, Delhi`,
        lat: locationData.lat,
        lng: locationData.lng,
        source: "reddit",
        sourceHandle: `u/${post.author}`,
        redditId: post.redditId,
        redditPermalink: post.permalink,
        timestamp: post.createdAt?.toISOString() || new Date().toISOString(),
      }

      await insertComplaint(complaint)

      // Send authority email (no citizen contact for batch — no user provided it)
      const emailResult = await sendAuthorityEmail(complaint, municipalContact, post.permalink)
      await updateComplaint(complaintId, { authority_email_sent: emailResult.success })

      results.registered++
      results.complaints.push({
        complaintId,
        title: post.title,
        department: classification.department,
        urgency: classification.urgency,
        location: complaint.location,
        authorityNotified: emailResult.success,
      })

      // Delay between posts to respect Nominatim rate limit
      await new Promise(r => setTimeout(r, 1200))
    }

    res.json({ success: true, ...results })

  } catch (err) {
    next(err)
  }
})

module.exports = router
