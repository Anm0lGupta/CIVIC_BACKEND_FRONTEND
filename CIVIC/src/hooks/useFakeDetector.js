// src/hooks/useFakeDetector.js
// Rule-based fake complaint detector used across the app

export function detectFakeComplaint(title, description, location) {
  const fullText = `${title} ${description} ${location}`.toLowerCase()
  const reasons = []
  const flags = []

  // --- SPAM SIGNALS ---
  if (/http|bit\.ly|tinyurl|click here|buy now|discount|promo code|free.*code|deal of/i.test(fullText)) {
    reasons.push("Contains promotional links or spam keywords")
    flags.push("SPAM_LINK")
  }

  if (/(.)\1{4,}/.test(fullText)) {
    reasons.push("Contains excessive repeated characters")
    flags.push("REPEATED_CHARS")
  }

  // --- LENGTH CHECKS ---
  if (description.trim().length < 20) {
    reasons.push("Description too short to be a genuine complaint")
    flags.push("TOO_SHORT")
  }

  if (title.trim().length < 8) {
    reasons.push("Title is too vague or short")
    flags.push("VAGUE_TITLE")
  }

  // --- GIBBERISH DETECTION ---
  const words = fullText.split(/\s+/).filter(w => w.length > 2)
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / (words.length || 1)
  if (avgWordLen > 12) {
    reasons.push("Text appears to contain gibberish or non-words")
    flags.push("GIBBERISH")
  }

  // --- JOKE / TEST PATTERNS ---
  if (/lol|haha|hehe|test complaint|just testing|fake complaint|this is a test|not real/i.test(fullText)) {
    reasons.push("Appears to be a test or joke submission")
    flags.push("JOKE_TEST")
  }

  // --- CIVIC KEYWORD CHECK ---
  const civicKeywords = [
    "pothole", "road", "street", "light", "streetlight", "electricity", "water",
    "garbage", "trash", "waste", "sewer", "drain", "flooding", "flood", "pipe",
    "park", "playground", "tree", "bench", "graffiti", "vandal", "bus", "transit",
    "signal", "traffic", "parking", "car", "vehicle", "abandoned", "dangerous",
    "hazard", "broken", "repair", "smell", "pest", "rat", "dirty", "unsafe",
    "blocked", "clogged", "noise", "construction", "dust", "smoke", "paani",
    "bijli", "sadak", "kachra", "nali", "school", "hospital", "leak"
  ]
  const hasCivic = civicKeywords.some(kw => fullText.includes(kw))
  if (!hasCivic && reasons.length === 0) {
    reasons.push("No recognizable civic issue keywords found")
    flags.push("NO_CIVIC_KEYWORDS")
  }

  // --- DUPLICATE-LIKE DETECTION ---
  const uniqueWords = new Set(words)
  const repetitionRatio = uniqueWords.size / (words.length || 1)
  if (words.length > 10 && repetitionRatio < 0.4) {
    reasons.push("Excessive word repetition detected")
    flags.push("REPETITIVE")
  }

  // Score: 0 = definitely fake, 100 = definitely real
  const score = Math.max(0, 100 - (reasons.length * 25))

  return {
    isFake: reasons.length > 0,
    reasons,
    flags,
    score,
    label: score >= 75 ? "Likely Genuine" : score >= 50 ? "Suspicious" : "Likely Fake"
  }
}