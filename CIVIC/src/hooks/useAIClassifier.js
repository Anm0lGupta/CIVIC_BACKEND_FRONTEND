// src/hooks/useAIClassifier.js
// Rule-based AI classifier that detects department + urgency from complaint text
// Simulates AI processing — impressive for demo without needing any API

const departmentRules = [
  {
    name: "Infrastructure",
    keywords: ["streetlight", "light", "electricity", "power", "signal", "traffic light",
      "crosswalk", "pedestrian", "pole", "wire", "cable", "transformer", "electric",
      "parking garage", "tunnel", "bridge", "overpass", "underpass"],
  },
  {
    name: "Roads",
    keywords: ["pothole", "road", "street", "pavement", "asphalt", "crack", "bump",
      "highway", "lane", "bike lane", "footpath", "sidewalk", "curb", "intersection",
      "speed breaker", "divider", "median", "gravel", "debris"],
  },
  {
    name: "Sanitation",
    keywords: ["garbage", "trash", "waste", "dump", "litter", "bin", "collection",
      "pickup", "smell", "odor", "rat", "pest", "rodent", "cockroach", "filth",
      "dirty", "sewage", "drainage", "overflow", "overflowing", "hygiene"],
  },
  {
    name: "Water",
    keywords: ["water", "pipe", "leak", "main", "flood", "flooding", "burst",
      "supply", "tap", "drinkable", "contaminated", "sewage", "drain", "storm drain",
      "gutter", "puddle", "waterlogging"],
  },
  {
    name: "Parks",
    keywords: ["park", "garden", "playground", "tree", "bush", "plant", "grass",
      "bench", "fountain", "trail", "pathway", "recreation", "green", "graffiti",
      "vandal", "restroom", "public toilet", "swing", "slide", "equipment"],
  },
  {
    name: "Transit",
    keywords: ["bus", "stop", "route", "schedule", "metro", "train", "transit",
      "transport", "commute", "timetable", "shelter", "platform", "ticket", "fare"],
  },
  {
    name: "Parking",
    keywords: ["parking", "car", "vehicle", "abandoned", "illegal", "tow",
      "double park", "blocking", "driveway", "garage", "permit", "fine", "challan"],
  },
]

const highUrgencyKeywords = [
  "danger", "dangerous", "urgent", "emergency", "safety", "hazard", "hazardous",
  "accident", "injury", "injure", "hurt", "blood", "fire", "burning", "flood",
  "flooding", "burst", "collapse", "fallen", "fell", "broken", "sparking",
  "electrocution", "electric shock", "gas leak", "toxic", "poisonous", "death",
  "dead", "critical", "immediately", "asap", "serious", "severe", "extreme",
  "week", "weeks", "month", "months", // long duration = higher urgency
]

const mediumUrgencyKeywords = [
  "inconvenient", "problem", "issue", "affecting", "blocked", "clogged",
  "overflowing", "damaged", "broken", "cracked", "missing", "not working",
  "dirty", "smelly", "pest", "rats", "dark", "unsafe", "repeated", "again",
  "still", "ongoing", "continues", "nobody", "no one", "ignored",
]

function scoreText(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.reduce((score, kw) => {
    // Exact word/phrase match scores higher
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = (lower.match(regex) || []).length
    return score + matches
  }, 0)
}

export function classifyComplaint(title, description) {
  const fullText = `${title} ${description}`

  // --- Detect Department ---
  let bestDept = null
  let bestScore = 0

  for (const dept of departmentRules) {
    const score = scoreText(fullText, dept.keywords)
    if (score > bestScore) {
      bestScore = score
      bestDept = dept.name
    }
  }

  // --- Detect Urgency ---
  const highScore = scoreText(fullText, highUrgencyKeywords)
  const medScore = scoreText(fullText, mediumUrgencyKeywords)

  let urgency = "low"
  if (highScore >= 2) urgency = "high"
  else if (highScore >= 1 || medScore >= 2) urgency = "medium"

  // Confidence: how sure are we?
  const confidence = bestScore === 0 ? 0 :
    bestScore >= 3 ? 95 :
    bestScore === 2 ? 80 :
    60

  return {
    department: bestDept,
    urgency,
    confidence,
    detected: bestScore > 0,
  }
}