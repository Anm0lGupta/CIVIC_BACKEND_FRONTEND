// src/middleware/errorHandler.js
// Global error handler — catches all errors thrown from routes
// Sends consistent JSON error responses instead of Express default HTML

/**
 * Express error handling middleware.
 * Must have 4 parameters (err, req, res, next) for Express to treat it as error handler.
 */
function errorHandler(err, req, res, next) {
  // Log the full error for debugging (server-side only)
  console.error(`\n❌ Error on ${req.method} ${req.path}:`)
  console.error("   Message:", err.message)
  if (process.env.NODE_ENV !== "production") {
    console.error("   Stack:", err.stack)
  }

  // Reddit rate limit error
  if (err.message?.includes("rate limit")) {
    return res.status(429).json({
      error: "Rate limit reached",
      message: err.message,
      retryAfter: "60 seconds"
    })
  }

  // Reddit connection error
  if (err.message?.includes("Could not connect to Reddit")) {
    return res.status(503).json({
      error: "External service unavailable",
      message: "Reddit API is unreachable. Try again later.",
    })
  }

  // Database errors
  if (err.message?.startsWith("Database error:")) {
    return res.status(500).json({
      error: "Database error",
      message: "Could not save to database. Check Supabase configuration.",
    })
  }

  // Default: Internal server error
  const statusCode = err.statusCode || err.status || 500
  res.status(statusCode).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : err.message, // show full message in development
  })
}

module.exports = { errorHandler }
