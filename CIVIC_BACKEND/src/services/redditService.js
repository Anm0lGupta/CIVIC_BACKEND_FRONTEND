// src/services/redditService.js
// Handles all Reddit API communication
//
// Reddit offers two access modes:
// 1. Unauthenticated: hit https://www.reddit.com/r/subreddit/search.json — simple, no token
// 2. OAuth: hit https://oauth.reddit.com — needed for higher rate limits (60 req/min vs 10/min)
//
// We implement BOTH and use OAuth when credentials are present.

const axios = require("axios")

// Reddit OAuth token cache — avoids fetching a new token on every request
// Tokens last 1 hour, so we cache and refresh when needed
let cachedToken = null
let tokenExpiresAt = 0

/**
 * Gets a Reddit OAuth access token.
 * Reddit uses client_credentials flow for script-type apps.
 * Returns null if env credentials are missing (falls back to public API).
 */
async function getRedditAccessToken() {
  // If we have a valid cached token, return it
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  // If no credentials configured, skip OAuth
  if (!clientId || !clientSecret) {
    return null
  }

  try {
    const response = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      "grant_type=client_credentials",
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Reddit requires a descriptive User-Agent
          "User-Agent": process.env.REDDIT_USER_AGENT || "CivicMirror/1.0",
        },
        timeout: 10000, // 10 second timeout
      }
    )

    cachedToken = response.data.access_token
    // expires_in is in seconds, convert to ms and subtract 60s buffer
    tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000

    console.log("✅ Reddit OAuth token acquired")
    return cachedToken

  } catch (err) {
    console.warn("⚠️  Reddit OAuth failed, falling back to public API:", err.message)
    return null
  }
}

/**
 * Searches Reddit for posts matching a keyword.
 * Tries OAuth first (higher rate limits), falls back to public JSON API.
 *
 * @param {string} keyword - The search term (e.g., "pothole")
 * @param {string} subreddit - Subreddit to search (default: "delhi")
 * @param {number} limit - Max number of posts to return (max 100)
 * @returns {Array} Array of raw Reddit post objects
 */
async function fetchRedditPosts(keyword, subreddit = "delhi", limit = 25) {
  const token = await getRedditAccessToken()
  const userAgent = process.env.REDDIT_USER_AGENT || "CivicMirror/1.0"

  // Build query — combine keyword with civic/location terms for better results
  const query = `${keyword} Delhi`

  let baseUrl, headers

  if (token) {
    // OAuth mode — higher rate limits, more reliable
    baseUrl = `https://oauth.reddit.com/r/${subreddit}/search`
    headers = {
      "Authorization": `Bearer ${token}`,
      "User-Agent": userAgent,
    }
  } else {
    // Public mode — no auth needed, but limited to 10 req/min
    baseUrl = `https://www.reddit.com/r/${subreddit}/search.json`
    headers = {
      "User-Agent": userAgent,
    }
  }

  try {
    const response = await axios.get(baseUrl, {
      headers,
      params: {
        q: query,
        restrict_sr: true,    // only search within this subreddit
        sort: "new",          // get newest posts first
        limit,
        t: "month",           // posts from the last month only
      },
      timeout: 15000, // 15 second timeout
    })

    // Reddit wraps data in data.children array
    const posts = response.data?.data?.children || []

    // Map to cleaner objects — only the fields we need
    return posts.map(({ data }) => ({
      redditId: data.id,
      title: data.title || "",
      body: data.selftext || "",                          // post body text
      author: data.author || "[deleted]",
      createdAt: new Date(data.created_utc * 1000),      // convert Unix timestamp
      permalink: `https://www.reddit.com${data.permalink}`,
      score: data.score || 0,                            // upvotes
      numComments: data.num_comments || 0,
      subreddit: data.subreddit,
    }))

  } catch (err) {
    // Handle Reddit rate limiting specifically (429 status)
    if (err.response?.status === 429) {
      const retryAfter = err.response.headers["retry-after"] || 60
      throw new Error(`Reddit rate limit hit. Wait ${retryAfter} seconds before retrying.`)
    }

    // Handle Reddit being down or unreachable
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      throw new Error("Could not connect to Reddit API. Check your internet connection.")
    }

    throw new Error(`Reddit API error: ${err.message}`)
  }
}

/**
 * Also searches across multiple subreddits for broader coverage.
 * r/delhi is the main one, but r/india and r/delhiNCR also have civic complaints.
 *
 * @param {string} keyword - Search term
 * @returns {Array} Combined, deduplicated posts from all subreddits
 */
async function fetchFromMultipleSubreddits(keyword) {
  const subreddits = ["delhi", "india", "delhiNCR"]
  const allPosts = []
  const seenIds = new Set()

  for (const sub of subreddits) {
    try {
      const posts = await fetchRedditPosts(keyword, sub, 15)

      for (const post of posts) {
        // Deduplicate by Reddit post ID (cross-posts have same ID)
        if (!seenIds.has(post.redditId)) {
          seenIds.add(post.redditId)
          allPosts.push(post)
        }
      }

      // Small delay between subreddit requests to respect rate limits
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      // Log but don't crash — if one subreddit fails, continue with others
      console.warn(`⚠️  Failed to fetch from r/${sub}:`, err.message)
    }
  }

  return allPosts
}

module.exports = {
  fetchRedditPosts,
  fetchFromMultipleSubreddits,
}
