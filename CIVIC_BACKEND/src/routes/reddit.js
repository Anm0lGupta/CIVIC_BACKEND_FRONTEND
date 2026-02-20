// src/routes/reddit.js
// GET /api/reddit/fetch?keyword=pothole
// Fetches Reddit posts for a keyword, classifies them, returns structured results
// This is the "preview" endpoint — doesn't save to DB, just shows what would be imported

const express = require("express")
const rateLimit = require("express-rate-limit")
const { fetchRedditPosts, fetchFromMultipleSubreddits } = require("../services/redditService")
const { classifyComplaint } = require("../services/classifierService")
const { extractAndGeocode } = require("../services/locationService")

const router = express.Router()

// Stricter rate limit for Reddit fetch — prevents hammering Reddit API
const redditFetchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5,              // max 5 Reddit fetches per minute per IP
  message: { error: "Too many Reddit requests. Wait 1 minute before fetching again." }
})

/**
 * GET /api/reddit/fetch
 *
 * Query parameters:
 *   keyword    - Search term (required). e.g. "pothole", "garbage", "water leak"
 *   subreddit  - Which subreddit (optional, default: "delhi")
 *   limit      - Max posts to fetch (optional, default: 20, max: 50)
 *   multi      - If "true", searches r/delhi + r/india + r/delhiNCR (optional)
 *
 * Response:
 *   {
 *     success: true,
 *     keyword: "pothole",
 *     totalFetched: 15,
 *     civicCount: 11,
 *     rejectedCount: 4,
 *     complaints: [ ... classified complaint objects ... ]
 *   }
 */
router.get("/fetch", redditFetchLimiter, async (req, res, next) => {
  try {
    const { keyword, subreddit = "delhi", limit = "20", multi } = req.query

    // Validate keyword
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        error: "keyword query parameter is required (min 2 characters)",
        example: "/api/reddit/fetch?keyword=pothole"
      })
    }

    const fetchLimit = Math.min(parseInt(limit) || 20, 50) // cap at 50
    const keyword_clean = keyword.trim().toLowerCase()

    console.log(`\n🔍 Fetching Reddit posts for keyword: "${keyword_clean}"`)

    // Fetch posts — either from one subreddit or multiple
    let rawPosts
    if (multi === "true") {
      rawPosts = await fetchFromMultipleSubreddits(keyword_clean)
    } else {
      rawPosts = await fetchRedditPosts(keyword_clean, subreddit, fetchLimit)
    }

    if (rawPosts.length === 0) {
      return res.json({
        success: true,
        keyword: keyword_clean,
        message: "No posts found for this keyword. Try a different search term.",
        totalFetched: 0,
        civicCount: 0,
        rejectedCount: 0,
        complaints: [],
      })
    }

    // Classify each post
    const results = []
    let rejected = 0

    for (const post of rawPosts) {
      const fullText = `${post.title} ${post.body}`
      const classification = classifyComplaint(post.title, post.body)

      // Skip non-civic posts
      if (!classification.isCivic) {
        rejected++
        continue
      }

      // Extract location (sync — no geocoding at preview stage to avoid delays)
      const { extractLocation } = require("../services/locationService")
      const localityName = extractLocation(fullText) || "Delhi"

      results.push({
        // Reddit post data
        redditId: post.redditId,
        redditTitle: post.title,
        redditBody: post.body?.slice(0, 500), // truncate long bodies for preview
        redditAuthor: post.author,
        redditPermalink: post.permalink,
        redditScore: post.score,
        // AI classification results
        department: classification.department,
        departmentFull: classification.departmentFull,
        urgency: classification.urgency,
        aiConfidence: classification.confidence,
        // Location (not geocoded yet — that happens on /register)
        extractedLocation: localityName,
        // Metadata
        createdAt: post.createdAt,
        isCivic: true,
      })
    }

    console.log(`✅ ${results.length} civic posts found, ${rejected} rejected`)

    res.json({
      success: true,
      keyword: keyword_clean,
      subreddit: multi === "true" ? "delhi + india + delhiNCR" : subreddit,
      totalFetched: rawPosts.length,
      civicCount: results.length,
      rejectedCount: rejected,
      complaints: results,
    })

  } catch (err) {
    // Pass to global error handler
    next(err)
  }
})

module.exports = router
