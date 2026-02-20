// src/data/municipalDirectory.js
// Static directory of Delhi municipal contacts by locality
//
// In production, this would be a database table that admins can update.
// For now it's a hardcoded map covering major Delhi zones.
//
// Structure: locality name → { district, body, email, phone }
// NOTE: Emails shown here are illustrative examples.
// Real MCD zone emails should be verified from mcd.gov.in

const MUNICIPAL_DIRECTORY = {

  // ─── CENTRAL DELHI ──────────────────────────────────────────────────────────
  "Connaught Place": {
    district: "Central Delhi",
    municipalBody: "NDMC (New Delhi Municipal Council)",
    zone: "NDMC Zone",
    email: "complaints@ndmc.gov.in",
    phone: "+91-11-23746000",
    pwdContact: "pwd_central@delhi.gov.in",
    waterContact: "djb.central@delhijalboard.in",
  },
  "Chandni Chowk": {
    district: "Central Delhi",
    municipalBody: "MCD Central Zone",
    zone: "City SP Zone",
    email: "mcd.central@mcdonline.gov.in",
    phone: "+91-11-23926060",
    pwdContact: "pwd_central@delhi.gov.in",
    waterContact: "djb.central@delhijalboard.in",
  },
  "Karol Bagh": {
    district: "Central Delhi",
    municipalBody: "MCD Central Zone",
    zone: "Karol Bagh Zone",
    email: "karolbagh.mcd@mcdonline.gov.in",
    phone: "+91-11-23581400",
    pwdContact: "pwd_central@delhi.gov.in",
    waterContact: "djb.central@delhijalboard.in",
  },
  "Paharganj": {
    district: "Central Delhi",
    municipalBody: "MCD Central Zone",
    zone: "City SP Zone",
    email: "mcd.central@mcdonline.gov.in",
    phone: "+91-11-23926060",
    pwdContact: "pwd_central@delhi.gov.in",
    waterContact: "djb.central@delhijalboard.in",
  },
  "Civil Lines": {
    district: "North Delhi",
    municipalBody: "MCD North Zone",
    zone: "Civil Lines Zone",
    email: "mcd.north@mcdonline.gov.in",
    phone: "+91-11-23960107",
    pwdContact: "pwd_north@delhi.gov.in",
    waterContact: "djb.north@delhijalboard.in",
  },

  // ─── WEST DELHI ─────────────────────────────────────────────────────────────
  "Janakpuri": {
    district: "West Delhi",
    municipalBody: "MCD West Zone",
    zone: "West Zone",
    email: "mcd.west@mcdonline.gov.in",
    phone: "+91-11-25524000",
    pwdContact: "pwd_west@delhi.gov.in",
    waterContact: "djb.west@delhijalboard.in",
  },
  "Dwarka": {
    district: "South West Delhi",
    municipalBody: "MCD South West Zone",
    zone: "Dwarka Zone",
    email: "dwarka.mcd@mcdonline.gov.in",
    phone: "+91-11-25088400",
    pwdContact: "pwd_southwest@delhi.gov.in",
    waterContact: "djb.southwest@delhijalboard.in",
  },
  "Vikaspuri": {
    district: "West Delhi",
    municipalBody: "MCD West Zone",
    zone: "West Zone",
    email: "mcd.west@mcdonline.gov.in",
    phone: "+91-11-25524000",
    pwdContact: "pwd_west@delhi.gov.in",
    waterContact: "djb.west@delhijalboard.in",
  },
  "Rajouri Garden": {
    district: "West Delhi",
    municipalBody: "MCD West Zone",
    zone: "West Zone",
    email: "mcd.west@mcdonline.gov.in",
    phone: "+91-11-25524000",
    pwdContact: "pwd_west@delhi.gov.in",
    waterContact: "djb.west@delhijalboard.in",
  },
  "Punjabi Bagh": {
    district: "West Delhi",
    municipalBody: "MCD West Zone",
    zone: "West Zone",
    email: "mcd.west@mcdonline.gov.in",
    phone: "+91-11-25524000",
    pwdContact: "pwd_west@delhi.gov.in",
    waterContact: "djb.west@delhijalboard.in",
  },
  "Tilak Nagar": {
    district: "West Delhi",
    municipalBody: "MCD West Zone",
    zone: "West Zone",
    email: "mcd.west@mcdonline.gov.in",
    phone: "+91-11-25524000",
    pwdContact: "pwd_west@delhi.gov.in",
    waterContact: "djb.west@delhijalboard.in",
  },

  // ─── SOUTH DELHI ────────────────────────────────────────────────────────────
  "Lajpat Nagar": {
    district: "South Delhi",
    municipalBody: "MCD South Zone",
    zone: "South Zone",
    email: "mcd.south@mcdonline.gov.in",
    phone: "+91-11-26260101",
    pwdContact: "pwd_south@delhi.gov.in",
    waterContact: "djb.south@delhijalboard.in",
  },
  "Hauz Khas": {
    district: "South Delhi",
    municipalBody: "MCD South Zone",
    zone: "South Zone",
    email: "mcd.south@mcdonline.gov.in",
    phone: "+91-11-26260101",
    pwdContact: "pwd_south@delhi.gov.in",
    waterContact: "djb.south@delhijalboard.in",
  },
  "Greater Kailash": {
    district: "South Delhi",
    municipalBody: "MCD South Zone",
    zone: "South Zone",
    email: "mcd.south@mcdonline.gov.in",
    phone: "+91-11-26260101",
    pwdContact: "pwd_south@delhi.gov.in",
    waterContact: "djb.south@delhijalboard.in",
  },
  "Saket": {
    district: "South Delhi",
    municipalBody: "MCD South Zone",
    zone: "South Zone",
    email: "mcd.south@mcdonline.gov.in",
    phone: "+91-11-26260101",
    pwdContact: "pwd_south@delhi.gov.in",
    waterContact: "djb.south@delhijalboard.in",
  },
  "Malviya Nagar": {
    district: "South Delhi",
    municipalBody: "MCD South Zone",
    zone: "South Zone",
    email: "mcd.south@mcdonline.gov.in",
    phone: "+91-11-26260101",
    pwdContact: "pwd_south@delhi.gov.in",
    waterContact: "djb.south@delhijalboard.in",
  },
  "Defence Colony": {
    district: "South Delhi",
    municipalBody: "MCD South Zone",
    zone: "South Zone",
    email: "mcd.south@mcdonline.gov.in",
    phone: "+91-11-26260101",
    pwdContact: "pwd_south@delhi.gov.in",
    waterContact: "djb.south@delhijalboard.in",
  },

  // ─── NORTH DELHI ────────────────────────────────────────────────────────────
  "Rohini": {
    district: "North West Delhi",
    municipalBody: "MCD Rohini Zone",
    zone: "Rohini Zone",
    email: "mcd.rohini@mcdonline.gov.in",
    phone: "+91-11-27044200",
    pwdContact: "pwd_northwest@delhi.gov.in",
    waterContact: "djb.northwest@delhijalboard.in",
  },
  "Pitampura": {
    district: "North West Delhi",
    municipalBody: "MCD Rohini Zone",
    zone: "Rohini Zone",
    email: "mcd.rohini@mcdonline.gov.in",
    phone: "+91-11-27044200",
    pwdContact: "pwd_northwest@delhi.gov.in",
    waterContact: "djb.northwest@delhijalboard.in",
  },
  "Model Town": {
    district: "North Delhi",
    municipalBody: "MCD North Zone",
    zone: "North Zone",
    email: "mcd.north@mcdonline.gov.in",
    phone: "+91-11-23960107",
    pwdContact: "pwd_north@delhi.gov.in",
    waterContact: "djb.north@delhijalboard.in",
  },
  "Ashok Vihar": {
    district: "North West Delhi",
    municipalBody: "MCD North Zone",
    zone: "North Zone",
    email: "mcd.north@mcdonline.gov.in",
    phone: "+91-11-23960107",
    pwdContact: "pwd_north@delhi.gov.in",
    waterContact: "djb.north@delhijalboard.in",
  },

  // ─── EAST DELHI ─────────────────────────────────────────────────────────────
  "Mayur Vihar": {
    district: "East Delhi",
    municipalBody: "MCD Shahdara South Zone",
    zone: "Shahdara South Zone",
    email: "mcd.shahdarasouth@mcdonline.gov.in",
    phone: "+91-11-22044700",
    pwdContact: "pwd_east@delhi.gov.in",
    waterContact: "djb.east@delhijalboard.in",
  },
  "Preet Vihar": {
    district: "East Delhi",
    municipalBody: "MCD Shahdara South Zone",
    zone: "Shahdara South Zone",
    email: "mcd.shahdarasouth@mcdonline.gov.in",
    phone: "+91-11-22044700",
    pwdContact: "pwd_east@delhi.gov.in",
    waterContact: "djb.east@delhijalboard.in",
  },
  "Laxmi Nagar": {
    district: "East Delhi",
    municipalBody: "MCD Shahdara South Zone",
    zone: "Shahdara South Zone",
    email: "mcd.shahdarasouth@mcdonline.gov.in",
    phone: "+91-11-22044700",
    pwdContact: "pwd_east@delhi.gov.in",
    waterContact: "djb.east@delhijalboard.in",
  },
  "Shahdara": {
    district: "Shahdara",
    municipalBody: "MCD Shahdara North Zone",
    zone: "Shahdara North Zone",
    email: "mcd.shahdaranorth@mcdonline.gov.in",
    phone: "+91-11-22813377",
    pwdContact: "pwd_east@delhi.gov.in",
    waterContact: "djb.east@delhijalboard.in",
  },
}

// ─── DEFAULT FALLBACK ─────────────────────────────────────────────────────────
// Used when we can't match the locality to any known zone
const DEFAULT_CONTACT = {
  district: "Delhi",
  municipalBody: "MCD Headquarters",
  zone: "Central Complaints Cell",
  email: "complaints@mcdonline.gov.in",
  phone: "+91-11-23924317",
  pwdContact: "pwd@delhi.gov.in",
  waterContact: "customercare@delhijalboard.in",
}

/**
 * Looks up municipal contact for a locality.
 * Tries exact match first, then partial match, then returns default.
 *
 * @param {string} localityName - e.g. "Janakpuri"
 * @param {string} department - e.g. "PWD" or "Jal Board" — for picking right email
 * @returns {object} Contact details
 */
function getMunicipalContact(localityName, department = null) {
  if (!localityName) return DEFAULT_CONTACT

  // Try exact match
  if (MUNICIPAL_DIRECTORY[localityName]) {
    const contact = { ...MUNICIPAL_DIRECTORY[localityName] }
    // Pick department-specific email if we know the department
    contact.primaryEmail = getDepartmentEmail(contact, department)
    return contact
  }

  // Try partial match (e.g. "Dwarka Sector 10" → "Dwarka")
  const partialKey = Object.keys(MUNICIPAL_DIRECTORY).find(key =>
    localityName.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(localityName.toLowerCase())
  )

  if (partialKey) {
    const contact = { ...MUNICIPAL_DIRECTORY[partialKey] }
    contact.primaryEmail = getDepartmentEmail(contact, department)
    return contact
  }

  // No match found — return default MCD HQ
  return { ...DEFAULT_CONTACT, primaryEmail: DEFAULT_CONTACT.email }
}

/**
 * Selects the most appropriate email based on complaint department.
 * PWD complaints → PWD email, Water complaints → Jal Board email, etc.
 */
function getDepartmentEmail(contact, department) {
  if (!department) return contact.email

  const dept = department.toLowerCase()
  if (dept.includes("pwd") || dept.includes("road")) return contact.pwdContact || contact.email
  if (dept.includes("water") || dept.includes("jal")) return contact.waterContact || contact.email
  return contact.email
}

module.exports = { getMunicipalContact, MUNICIPAL_DIRECTORY }
