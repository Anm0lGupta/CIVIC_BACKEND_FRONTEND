// src/services/emailService.js
// Handles all outgoing emails using Nodemailer + Gmail
//
// Two types of emails:
// 1. Authority email — sent to the municipal corporation about the complaint
// 2. Citizen confirmation — sent to the person who filed the complaint
//
// Setup: In your Gmail account → Security → 2-Step Verification → App Passwords
// Generate a 16-character app password and put it in EMAIL_PASS in .env

const nodemailer = require("nodemailer")

// ─── TRANSPORTER SETUP ────────────────────────────────────────────────────────
// We create the transporter once and reuse it (connection pooling)
// In production, switch to SendGrid or AWS SES for higher volume

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS in .env")
    return null
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for port 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password, not regular Gmail password
    },
    // Timeout settings to prevent hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  })

  return transporter
}

/**
 * Sends an email to the relevant municipal authority about a new complaint.
 * This is the "forward complaint to government" step.
 *
 * @param {object} complaint - The full complaint record
 * @param {object} municipalContact - Contact details from directory
 * @param {string} redditPermalink - Link to original Reddit post
 */
async function sendAuthorityEmail(complaint, municipalContact, redditPermalink) {
  const transport = getTransporter()

  // If email not configured, log and skip (don't crash the whole flow)
  if (!transport) {
    console.log("📧 [MOCK] Authority email would be sent to:", municipalContact.primaryEmail || municipalContact.email)
    console.log("   Complaint ID:", complaint.complaintId)
    return { success: true, mock: true }
  }

  // Determine urgency styling for email
  const urgencyEmoji = {
    high: "🔴 HIGH PRIORITY",
    medium: "🟡 MEDIUM PRIORITY",
    low: "🟢 LOW PRIORITY"
  }[complaint.urgency] || "🟡 MEDIUM PRIORITY"

  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 24px; border: 1px solid #e2e8f0; border-top: none; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
    .urgency-high { background: #fee2e2; color: #991b1b; }
    .urgency-medium { background: #fef3c7; color: #92400e; }
    .urgency-low { background: #dcfce7; color: #166534; }
    .field { margin: 12px 0; }
    .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
    .value { color: #0f172a; font-size: 15px; margin-top: 2px; }
    .complaint-id { font-family: monospace; font-size: 18px; color: #f97316; font-weight: bold; }
    .footer { background: #f8fafc; padding: 16px; border-radius: 0 0 8px 8px; font-size: 12px; color: #94a3b8; }
    .action-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 16px; border-radius: 8px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0">⬡ Civic Mirror — New Complaint Alert</h2>
    <p style="margin:4px 0 0; opacity:0.85; font-size:14px">Transparency Platform — Automated Complaint Notification</p>
  </div>

  <div class="content">
    <p>Dear ${municipalContact.municipalBody},</p>
    <p>A new civic complaint has been detected and registered through the Civic Mirror platform. Please review and take appropriate action within the stipulated SLA period.</p>

    <div class="field">
      <div class="label">Complaint ID</div>
      <div class="complaint-id">${complaint.complaintId}</div>
    </div>

    <div class="field">
      <div class="label">Priority</div>
      <span class="badge urgency-${complaint.urgency}">${urgencyEmoji}</span>
    </div>

    <div class="field">
      <div class="label">Issue Title</div>
      <div class="value">${complaint.title}</div>
    </div>

    <div class="field">
      <div class="label">Full Description</div>
      <div class="value" style="line-height:1.6">${complaint.description}</div>
    </div>

    <div class="field">
      <div class="label">Location</div>
      <div class="value">📍 ${complaint.location}</div>
      ${complaint.lat && complaint.lng ? `
      <div style="font-size:13px; color:#64748b; margin-top:4px">
        Coordinates: ${complaint.lat.toFixed(4)}, ${complaint.lng.toFixed(4)} —
        <a href="https://maps.google.com/?q=${complaint.lat},${complaint.lng}" style="color:#f97316">View on Google Maps</a>
      </div>` : ""}
    </div>

    <div class="field">
      <div class="label">Department Assigned</div>
      <div class="value">🏛️ ${complaint.departmentFull || complaint.department}</div>
    </div>

    <div class="field">
      <div class="label">Source</div>
      <div class="value">
        Reddit (r/delhi) — <a href="${redditPermalink}" style="color:#f97316">View Original Post</a>
      </div>
    </div>

    <div class="field">
      <div class="label">Reported On</div>
      <div class="value">${new Date(complaint.timestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "short"
      })}</div>
    </div>

    <div class="action-box">
      <strong>⏰ Action Required</strong><br>
      <span style="font-size:14px; color:#78350f">
        As per SLA, this complaint should be acknowledged within 24 hours and resolved within
        ${complaint.urgency === "high" ? "3 days" : complaint.urgency === "medium" ? "7 days" : "15 days"}.
        Please update the complaint status at: <strong>${complaint.complaintId}</strong>
      </span>
    </div>
  </div>

  <div class="footer">
    This is an automated message from Civic Mirror — Civic Accountability Platform.<br>
    Built for CODEZEN 2026 · Team DataCrafters · Do not reply to this email.
  </div>
</body>
</html>
  `.trim()

  try {
    const info = await transport.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Civic Mirror"}" <${process.env.EMAIL_USER}>`,
      to: municipalContact.primaryEmail || municipalContact.email,
      // CC the PWD/Water email too if it's different
      cc: [municipalContact.pwdContact, municipalContact.waterContact]
        .filter(e => e && e !== (municipalContact.primaryEmail || municipalContact.email))
        .join(",") || undefined,
      subject: `🚨 New Civic Complaint – ${complaint.complaintId} – ${complaint.location} [${complaint.urgency?.toUpperCase()}]`,
      html: emailBody,
      // Plain text fallback for email clients that don't render HTML
      text: `
Civic Mirror — New Complaint Alert
Complaint ID: ${complaint.complaintId}
Priority: ${complaint.urgency?.toUpperCase()}
Issue: ${complaint.title}
Description: ${complaint.description}
Location: ${complaint.location}
Department: ${complaint.department}
Source: ${redditPermalink}
Reported: ${new Date(complaint.timestamp).toLocaleString("en-IN")}
      `.trim()
    })

    console.log(`✅ Authority email sent: ${info.messageId} → ${municipalContact.primaryEmail}`)
    return { success: true, messageId: info.messageId }

  } catch (err) {
    console.error("❌ Failed to send authority email:", err.message)
    // Don't throw — email failure shouldn't fail the whole complaint registration
    return { success: false, error: err.message }
  }
}

/**
 * Sends a confirmation email to the citizen who filed the complaint.
 *
 * @param {string} citizenEmail - Email address to send to
 * @param {object} complaint - The registered complaint
 */
async function sendCitizenConfirmation(citizenEmail, complaint) {
  const transport = getTransporter()

  if (!transport) {
    console.log(`📧 [MOCK] Citizen confirmation would be sent to: ${citizenEmail}`)
    console.log(`   Complaint ID: ${complaint.complaintId}`)
    return { success: true, mock: true }
  }

  if (!citizenEmail || !citizenEmail.includes("@")) {
    console.warn("⚠️  Invalid citizen email:", citizenEmail)
    return { success: false, error: "Invalid email address" }
  }

  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #0f172a; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { padding: 24px; border: 1px solid #e2e8f0; border-top: none; }
    .id-box { background: #0f172a; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .id-text { font-family: monospace; font-size: 28px; color: #f97316; font-weight: bold; letter-spacing: 3px; }
    .timeline { border-left: 3px solid #f97316; padding-left: 16px; margin: 16px 0; }
    .step { margin: 12px 0; }
    .step-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #f97316; margin-right: 8px; margin-left: -20px; }
    .footer { background: #f8fafc; padding: 16px; border-radius: 0 0 8px 8px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0">⬡ Civic Mirror</h2>
    <p style="margin:4px 0 0; opacity:0.7; font-size:14px">Your complaint has been registered ✅</p>
  </div>

  <div class="content">
    <p>Thank you for reporting a civic issue. Your complaint has been <strong>successfully registered</strong> and forwarded to the relevant municipal authority.</p>

    <div class="id-box">
      <p style="color:#94a3b8; margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:1px">Your Complaint ID</p>
      <div class="id-text">${complaint.complaintId}</div>
      <p style="color:#64748b; margin:8px 0 0; font-size:12px">Save this ID to track your complaint status</p>
    </div>

    <p><strong>Issue reported:</strong> ${complaint.title}</p>
    <p><strong>Location:</strong> 📍 ${complaint.location}</p>
    <p><strong>Department notified:</strong> 🏛️ ${complaint.departmentFull || complaint.department}</p>
    <p><strong>Priority:</strong> ${complaint.urgency === "high" ? "🔴 High" : complaint.urgency === "medium" ? "🟡 Medium" : "🟢 Low"}</p>

    <h3 style="color:#0f172a; margin-top:24px">What happens next?</h3>
    <div class="timeline">
      <div class="step"><span class="step-dot"></span> <strong>Now</strong> — Complaint registered and authority notified</div>
      <div class="step"><span class="step-dot"></span> <strong>Within 24 hours</strong> — Municipal authority acknowledges your complaint</div>
      <div class="step"><span class="step-dot"></span> <strong>Within ${complaint.urgency === "high" ? "3 days" : "7 days"}</strong> — Field team visits the location</div>
      <div class="step"><span class="step-dot"></span> <strong>Resolution</strong> — Issue resolved and status updated to "Resolved"</div>
    </div>

    <p style="color:#64748b; font-size:14px">
      You can track the status of your complaint at any time by entering your Complaint ID
      on the Civic Mirror platform.
    </p>
  </div>

  <div class="footer">
    This complaint was automatically registered via the Reddit AI scraper.<br>
    Civic Mirror · CODEZEN 2026 · Team DataCrafters · Do not reply to this email.
  </div>
</body>
</html>
  `.trim()

  try {
    const info = await transport.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Civic Mirror"}" <${process.env.EMAIL_USER}>`,
      to: citizenEmail,
      subject: `✅ Complaint Registered – ${complaint.complaintId} – Civic Mirror`,
      html: emailBody,
      text: `
Your complaint has been registered with Civic Mirror.
Complaint ID: ${complaint.complaintId}
Issue: ${complaint.title}
Location: ${complaint.location}
Department notified: ${complaint.department}
Priority: ${complaint.urgency?.toUpperCase()}

Track your complaint at: https://civicmirror.in/track?id=${complaint.complaintId}
      `.trim()
    })

    console.log(`✅ Citizen confirmation sent: ${info.messageId} → ${citizenEmail}`)
    return { success: true, messageId: info.messageId }

  } catch (err) {
    console.error("❌ Failed to send citizen confirmation:", err.message)
    return { success: false, error: err.message }
  }
}

module.exports = {
  sendAuthorityEmail,
  sendCitizenConfirmation,
}
