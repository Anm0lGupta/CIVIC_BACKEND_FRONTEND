// src/services/locationService.js
// Extracts location names from text and geocodes them to lat/lng
//
// Two steps:
// 1. extractLocation(text) — finds a Delhi neighbourhood name in the text
// 2. geocodeLocation(placeName) — calls OpenStreetMap Nominatim to get lat/lng
//
// OpenStreetMap Nominatim is completely free with no API key.
// Rate limit: 1 request per second — we handle this with a small delay.

const axios = require("axios")

// ─── DELHI LOCALITY DICTIONARY ─────────────────────────────────────────────────
// This is the master list of Delhi localities we can recognize.
// Listed roughly from most specific (colonies) to broader (districts).
// Order matters — we check longer phrases first to avoid partial matches.

const DELHI_LOCALITIES = [
  // Central Delhi
  "Connaught Place", "Karol Bagh", "Paharganj", "Daryaganj", "Chandni Chowk",
  "Lal Kuan", "Kashmere Gate", "Civil Lines", "Tis Hazari", "Mori Gate",

  // South Delhi
  "Hauz Khas", "Green Park", "South Extension", "Lajpat Nagar", "Defence Colony",
  "Greater Kailash", "Malviya Nagar", "Saket", "Mehrauli", "Vasant Kunj",
  "Vasant Vihar", "R K Puram", "Munirka", "Safdarjung", "Andrews Ganj",

  // West Delhi
  "Janakpuri", "Dwarka", "Vikaspuri", "Uttam Nagar", "Tilak Nagar",
  "Rajouri Garden", "Mayapuri", "Punjabi Bagh", "Paschim Vihar", "Subhash Nagar",

  // North Delhi
  "Model Town", "Pitampura", "Rohini", "Shalimar Bagh", "Ashok Vihar",
  "Wazirpur", "Shakurpur", "Lawrence Road", "Rani Bagh",

  // East Delhi
  "Laxmi Nagar", "Preet Vihar", "Mayur Vihar", "Patparganj", "Kondli",
  "Geeta Colony", "Shahdara", "Dilshad Garden", "Vivek Vihar",

  // North East Delhi
  "Yamuna Vihar", "Bhajanpura", "Mustafabad", "Seelampur",

  // South West Delhi
  "Dwarka Sector 10", "Dwarka Sector 6", "Dwarka Sector 7", "Dwarka Sector 8",
  "Dwarka Sector 12", "Dwarka Sector 13", "Dwarka Sector 14",

  // Famous landmarks often mentioned as location references
  "India Gate", "Lodhi Garden", "Nehru Place", "Sarojini Nagar", "INA Market",
  "Moti Bagh", "Chanakyapuri", "Diplomatic Enclave",

  // Broader zones (fallbacks)
  "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi",
  "New Delhi"
]

/**
 * Extracts a Delhi locality name from complaint text.
 * Looks for known locality names in the text (case-insensitive).
 *
 * @param {string} text - The complaint title + description combined
 * @returns {string|null} The locality name found, or null if not detected
 */
function extractLocation(text) {
  if (!text || typeof text !== "string") return null

  const lowerText = text.toLowerCase()

  // Check localities from most specific to least specific
  for (const locality of DELHI_LOCALITIES) {
    if (lowerText.includes(locality.toLowerCase())) {
      return locality
    }
  }

  // Fallback: look for "in [word], Delhi" or "near [word]" patterns
  // This catches locations not in our dictionary
  const patterns = [
    /in ([A-Z][a-zA-Z\s]+),?\s*Delhi/,
    /at ([A-Z][a-zA-Z\s]+),?\s*Delhi/,
    /near ([A-Z][a-zA-Z\s]+(?:Nagar|Colony|Vihar|Bagh|Enclave|Extension|Park|Market|Chowk))/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const extracted = match[1].trim()
      // Only return if it's a reasonable place name (2-4 words, reasonable length)
      if (extracted.length > 3 && extracted.length < 50) {
        return extracted
      }
    }
  }

  return null // Could not extract a location
}

/**
 * Converts a place name to lat/lng coordinates using OpenStreetMap Nominatim.
 * This is completely free — no API key needed.
 * Rate limit: 1 request/second. We respect this with a 1.1s delay after each call.
 *
 * @param {string} placeName - e.g. "Janakpuri, Delhi"
 * @returns {{ lat: number, lng: number, displayName: string } | null}
 */
async function geocodeLocation(placeName) {
  if (!placeName) return null

  // Always append "Delhi, India" to improve geocoding accuracy
  const query = `${placeName}, Delhi, India`

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        limit: 1,              // we only need the top result
        countrycodes: "in",   // restrict to India
        addressdetails: 1,    // include full address breakdown
      },
      headers: {
        // Nominatim REQUIRES a descriptive User-Agent — required by their ToS
        "User-Agent": "CivicMirrorApp/1.0 (contact@civicmirror.in)"
      },
      timeout: 8000, // 8 second timeout
    })

    if (!response.data || response.data.length === 0) {
      console.warn(`📍 Geocoding failed for "${placeName}" — no results from Nominatim`)
      return null
    }

    const result = response.data[0]

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      // Nominatim returns bounding box — useful for map zoom level
      boundingBox: result.boundingbox,
    }

  } catch (err) {
    // Nominatim might be temporarily down or slow
    console.warn(`📍 Geocoding error for "${placeName}":`, err.message)
    return null
  }
}

/**
 * Combined helper — extracts location from text AND geocodes it in one call.
 * This is what the main route will use.
 *
 * @param {string} text - Complaint text
 * @returns {{ localityName, lat, lng, displayName } | { localityName, lat: null, lng: null }}
 */
async function extractAndGeocode(text) {
  const localityName = extractLocation(text)

  if (!localityName) {
    return {
      localityName: "Delhi",  // fallback to city level
      lat: 28.6139,           // Delhi city center coords
      lng: 77.2090,
      displayName: "Delhi, India",
      geocoded: false,        // flag that this is a fallback
    }
  }

  // Respect Nominatim rate limit (1 req/sec)
  await new Promise(r => setTimeout(r, 1100))

  const coords = await geocodeLocation(localityName)

  if (!coords) {
    // Geocoding failed but we have the name — use Delhi center as fallback
    return {
      localityName,
      lat: 28.6139,
      lng: 77.2090,
      displayName: `${localityName}, Delhi, India`,
      geocoded: false,
    }
  }

  return {
    localityName,
    ...coords,
    geocoded: true,
  }
}

module.exports = {
  extractLocation,
  geocodeLocation,
  extractAndGeocode,
}
