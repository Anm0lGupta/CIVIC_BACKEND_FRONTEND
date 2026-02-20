// src/index.js — Entry point for Civic Mirror backend
// Starts Express server, registers routes, global error handling

require("dotenv").config()
const express = require("express")
const cors = require("cors")
const rateLimit = require("express-rate-limit")

const redditRoutes = require("./routes/reddit")
const complaintRoutes = require("./routes/complaint")
const { errorHandler } = require("./middleware/errorHandler")

const app = express()
const PORT = process.env.PORT || 3001

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

// Allow requests from the React frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

// Parse incoming JSON request bodies
app.use(express.json({ limit: "1mb" }))

// Global rate limiter — max 100 requests per 15 minutes per IP
// Prevents abuse of the API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
})
app.use(globalLimiter)

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check — useful to confirm server is running
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Civic Mirror Backend",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  })
})

// Reddit scraping + complaint registration endpoints
app.use("/api/reddit", redditRoutes)
app.use("/api/complaint", complaintRoutes)

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// Global error handler (catches anything thrown inside routes)
app.use(errorHandler)

// ─── START SERVER ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Civic Mirror Backend running on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/health`)
  console.log(`   Reddit API:   http://localhost:${PORT}/api/reddit/fetch?keyword=pothole`)
  console.log(`   Environment:  ${process.env.NODE_ENV || "development"}\n`)
})

module.exports = app
