// src/services/smsService.js
// Sends SMS confirmation to citizens via Twilio
// Falls back to console mock if Twilio is not configured
//
// To set up Twilio:
// 1. Create account at twilio.com (free trial gives $15 credit)
// 2. Get Account SID and Auth Token from console
// 3. Get a Twilio phone number (free with trial)
// 4. Add to .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

/**
 * Sends an SMS to a citizen confirming their complaint was registered.
 *
 * @param {string} phoneNumber - Citizen's phone number (e.g., "+919876543210")
 * @param {object} complaint - The registered complaint object
 * @returns {{ success: boolean, mock?: boolean, sid?: string }}
 */
async function sendCitizenSMS(phoneNumber, complaint) {
  // Validate phone number format
  if (!phoneNumber || phoneNumber.length < 10) {
    return { success: false, error: "Invalid phone number" }
  }

  // Format phone number — add India country code if missing
  const formattedPhone = formatIndianPhone(phoneNumber)

  // Check if Twilio is configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  const smsBody = [
    `Civic Mirror: Complaint ${complaint.complaintId} registered.`,
    `Issue: ${complaint.title.slice(0, 60)}`,
    `Dept: ${complaint.department}`,
    `Track at: civicmirror.in/track`,
  ].join("\n")

  // ── MOCK MODE (Twilio not configured) ─────────────────────────────────────
  if (!accountSid || !authToken || !fromNumber) {
    console.log("\n📱 [SMS MOCK — configure Twilio to send real SMS]")
    console.log("   To:", formattedPhone)
    console.log("   Message:", smsBody)
    console.log("")
    return { success: true, mock: true, phone: formattedPhone }
  }

  // ── REAL TWILIO SMS ────────────────────────────────────────────────────────
  try {
    // Dynamic import — if Twilio package isn't installed, falls back to mock
    const twilio = require("twilio")
    const client = twilio(accountSid, authToken)

    const message = await client.messages.create({
      body: smsBody,
      from: fromNumber,
      to: formattedPhone,
    })

    console.log(`✅ SMS sent: ${message.sid} → ${formattedPhone}`)
    return { success: true, sid: message.sid }

  } catch (err) {
    console.error("❌ SMS failed:", err.message)

    // Don't crash the whole flow — SMS failure is non-critical
    // Log it and continue
    return { success: false, error: err.message }
  }
}

/**
 * Formats an Indian phone number to E.164 format (+91XXXXXXXXXX)
 * Handles inputs like: 9876543210, 09876543210, +919876543210
 */
function formatIndianPhone(phone) {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")

  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}` // already has country code
  }

  if (digits.length === 10) {
    return `+91${digits}` // add India code
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+91${digits.slice(1)}` // remove leading 0, add India code
  }

  // Return as-is with + if it already has enough digits
  return phone.startsWith("+") ? phone : `+${digits}`
}

module.exports = { sendCitizenSMS }
