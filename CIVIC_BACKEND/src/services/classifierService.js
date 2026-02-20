// src/services/classifierService.js
// AI Classification engine for civic complaints
//
// This is a keyword-scoring approach — no external AI API needed.
// Each department has a list of keywords. We score the complaint text
// against each and pick the highest scorer.
//
// Why not use OpenAI/HuggingFace here?
// For a hackathon demo, keyword scoring is:
// - Instant (no API latency)
// - Free (no rate limits)
// - Explainable (you can show the mentor exactly why it picked a department)
// - Offline (works without internet for AI)

// ─── DEPARTMENT KEYWORD DICTIONARIES ─────────────────────────────────────────
// Each array has the keywords that strongly indicate this department.
// Hindi transliterations are included because Delhi Reddit posts mix languages.

const DEPARTMENT_RULES = [
  {
    name: "PWD",           // Public Works Department
    fullName: "Public Works Department",
    keywords: [
      "pothole", "road", "street", "pavement", "asphalt", "highway", "lane",
      "footpath", "sidewalk", "divider", "median", "crack", "bump", "broken road",
      "sadak", "gutter filled", "road repair", "overpass", "underpass", "bridge",
      "road damage", "road condition", "construction", "debris on road", "gravel"
    ],
  },
  {
    name: "Jal Board",     // Delhi Jal Board — handles water supply and sewage
    fullName: "Delhi Jal Board",
    keywords: [
      "water", "pipe", "leak", "main", "supply", "tap", "drinkable", "contaminated",
      "sewage", "drain", "sewer", "waterlogging", "flood", "flooding", "burst pipe",
      "paani", "nali", "drainage", "storm drain", "puddle", "overflow", "water supply",
      "no water", "water cut", "dirty water", "water tank", "borewell", "groundwater"
    ],
  },
  {
    name: "Sanitation",    // MCD Sanitation — garbage, waste management
    fullName: "MCD Sanitation Department",
    keywords: [
      "garbage", "trash", "waste", "dump", "litter", "bin", "collection", "pickup",
      "smell", "odor", "rat", "pest", "rodent", "cockroach", "filth", "dirty",
      "kachra", "safai", "sweeper", "overflowing bin", "dumping", "illegal dump",
      "hygiene", "open garbage", "waste disposal", "solid waste", "sanitation worker"
    ],
  },
  {
    name: "Electricity",   // BSES / TPDDL — power supply
    fullName: "Delhi Electricity Supply Board",
    keywords: [
      "electricity", "power", "light", "streetlight", "transformer", "wire", "cable",
      "electric", "bijli", "current", "voltage", "outage", "power cut", "tripping",
      "sparking", "electric shock", "loose wire", "fallen wire", "no electricity",
      "power failure", "load shedding", "meter", "short circuit"
    ],
  },
  {
    name: "Parks",         // DDA / MCD Parks
    fullName: "Parks and Gardens Department",
    keywords: [
      "park", "garden", "playground", "tree", "bush", "grass", "bench", "fountain",
      "trail", "green", "graffiti", "vandal", "restroom", "swing", "slide",
      "park equipment", "DDA park", "fallen tree", "dead tree", "overgrown",
      "recreation", "public space", "plant", "hedge"
    ],
  },
  {
    name: "Traffic",       // Delhi Traffic Police
    fullName: "Delhi Traffic Police",
    keywords: [
      "traffic", "signal", "jam", "congestion", "parking", "illegal parking",
      "double parking", "blocking", "challan", "no parking", "traffic light",
      "zebra crossing", "divider broken", "one way", "road block", "barricade",
      "accident", "speeding", "traffic management", "rush hour"
    ],
  },
  {
    name: "Health",        // MCD Health
    fullName: "MCD Health Department",
    keywords: [
      "mosquito", "dengue", "malaria", "stagnant water", "vector", "fogging",
      "hospital", "clinic", "dispensary", "ambulance", "health hazard",
      "disease", "epidemic", "fumigation", "health camp", "medicine"
    ],
  },
]

// ─── URGENCY KEYWORD DICTIONARIES ─────────────────────────────────────────────

const HIGH_URGENCY_WORDS = [
  "danger", "dangerous", "urgent", "emergency", "hazard", "hazardous",
  "accident", "injury", "hurt", "blood", "fire", "burning", "flooding",
  "collapse", "fallen", "sparking", "electrocution", "gas leak", "toxic",
  "death", "critical", "immediately", "asap", "severe", "extreme",
  "no water for days", "weeks", "4 days", "5 days", "month", "months",
  "ambulance", "hospital", "child hurt", "kids danger", "school"
]

const MEDIUM_URGENCY_WORDS = [
  "problem", "issue", "blocked", "clogged", "overflowing", "damaged",
  "broken", "missing", "not working", "dirty", "smelly", "pest", "rats",
  "dark", "unsafe", "repeated", "again", "still", "ongoing", "nobody",
  "no one", "ignored", "not resolved", "days", "weeks", "inconvenient"
]

// ─── CIVIC VALIDATION KEYWORDS ─────────────────────────────────────────────────
// A post must match at least one of these to be considered a civic complaint.
// This prevents Reddit memes, news articles, etc. from being imported.

const CIVIC_KEYWORDS = [
  "pothole", "road", "street", "water", "garbage", "trash", "light",
  "electricity", "sewer", "drain", "park", "signal", "parking", "tree",
  "pipe", "leak", "flood", "smell", "waste", "repair", "broken", "fix",
  "complaint", "paani", "bijli", "sadak", "kachra", "nali", "safai",
  "government", "authority", "mcd", "dda", "bses", "pwdurban", "municipal"
]

/**
 * Scores text against a keyword list.
 * Returns count of keyword matches (phrase matches score higher than single words).
 */
function scoreText(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.reduce((score, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escaped}\\b`, "gi")
    const matches = (lower.match(regex) || []).length
    // Phrases (multi-word keywords) score double — they're more specific signals
    const weight = keyword.includes(" ") ? 2 : 1
    return score + (matches * weight)
  }, 0)
}

/**
 * Detects the department and urgency from complaint text.
 *
 * @param {string} title - Post title
 * @param {string} body - Post body/description
 * @returns {{ department, departmentFull, urgency, confidence, isCivic }}
 */
function classifyComplaint(title, body = "") {
  const fullText = `${title} ${body}`

  // Step 1: Is this even a civic complaint?
  const civicScore = scoreText(fullText, CIVIC_KEYWORDS)
  if (civicScore < 2) {
    return {
      isCivic: false,
      department: null,
      departmentFull: null,
      urgency: null,
      confidence: 0,
      reason: "No civic keywords detected in post",
    }
  }

  // Step 2: Find best matching department
  let bestDept = null
  let bestScore = 0

  for (const dept of DEPARTMENT_RULES) {
    const score = scoreText(fullText, dept.keywords)
    if (score > bestScore) {
      bestScore = score
      bestDept = dept
    }
  }

  // Step 3: Calculate confidence based on how many keywords matched
  // Score 0 = 0%, score 1 = 60%, score 2 = 75%, score 3+ = 85-95%
  let confidence = 0
  if (bestScore >= 4) confidence = 95
  else if (bestScore === 3) confidence = 85
  else if (bestScore === 2) confidence = 75
  else if (bestScore === 1) confidence = 60
  else confidence = 40 // matched civic keywords but not department

  // Step 4: Detect urgency
  const highScore = scoreText(fullText, HIGH_URGENCY_WORDS)
  const medScore = scoreText(fullText, MEDIUM_URGENCY_WORDS)

  let urgency = "low"
  if (highScore >= 2) urgency = "high"
  else if (highScore >= 1 || medScore >= 2) urgency = "medium"

  return {
    isCivic: true,
    department: bestDept?.name || "General",
    departmentFull: bestDept?.fullName || "Municipal Corporation",
    urgency,
    confidence,
    keywordScore: bestScore,
  }
}

module.exports = { classifyComplaint }
