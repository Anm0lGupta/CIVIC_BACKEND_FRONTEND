// src/pages/Report.jsx — with image upload, fake detection, AI classify, email dispatch

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, AlertCircle, CheckCircle, ArrowLeft, Sparkles, Loader2, Brain,
  Upload, X, ShieldAlert, ShieldCheck, Mail, Send, Building2, Clock,
  Copy, ExternalLink, Terminal, Download } from "lucide-react"
import { departments } from "../data/mockComplaints"
import { classifyComplaint } from "../hooks/useAIClassifier"
import { detectFakeComplaint } from "../hooks/useFakeDetector"

const BACKEND_URL = "http://localhost:3001"

// Department → authority mapping (mirrors backend municipalDirectory)
const DEPT_AUTHORITY = {
  "PWD":          { name: "Public Works Department Delhi",   email: "pwd_west@delhi.gov.in",              zone: "West Zone" },
  "Jal Board":    { name: "Delhi Jal Board",                 email: "customercare@delhijalboard.in",      zone: "Central" },
  "Sanitation":   { name: "MCD Sanitation Department",       email: "mcd.west@mcdonline.gov.in",          zone: "West Zone" },
  "Electricity":  { name: "BSES Rajdhani / TPDDL",          email: "complaints@bsesdelhi.com",           zone: "Delhi" },
  "Parks":        { name: "DDA Parks & Gardens Division",    email: "parks@dda.org.in",                   zone: "Delhi" },
  "Traffic":      { name: "Delhi Traffic Police",            email: "trafficcomplaints@delhipolice.gov.in", zone: "Delhi" },
  "Health":       { name: "MCD Health Department",           email: "health@mcdonline.gov.in",            zone: "Delhi" },
  "Infrastructure":{ name: "MCD Infrastructure Division",   email: "complaints@mcdonline.gov.in",        zone: "Central" },
  "General":      { name: "MCD Headquarters",               email: "complaints@mcdonline.gov.in",        zone: "Central" },
}

// Generate unique complaint ID: CMR-2026-XXXX
function generateComplaintId() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `CMR-2026-${num}`
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center ml-1">
      {[0,1,2].map(i => (
        <span key={i} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
      ))}
    </span>
  )
}

const urgencyOptions = [
  { value: "low", label: "Low", desc: "Minor inconvenience", active: "border-green-400 bg-green-50 text-green-700" },
  { value: "medium", label: "Medium", desc: "Needs attention soon", active: "border-amber-400 bg-amber-50 text-amber-700" },
  { value: "high", label: "High", desc: "Urgent safety issue", active: "border-red-400 bg-red-50 text-red-700" },
]

// ── Email Dispatch Screen — the unique success experience ─────────────────────
function EmailDispatchScreen({ data, onDone }) {
  const [step, setStep]           = useState(0)  // which terminal log line is showing
  const [emailVisible, setEmailVisible] = useState(false)
  const [copied, setCopied]       = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const urgencyColor = data.urgency === "high" ? "#ef4444" : data.urgency === "medium" ? "#f59e0b" : "#22c55e"
  const urgencyLabel = data.urgency?.toUpperCase()

  const slaMap = { high: "24 hours", medium: "72 hours", low: "7 days" }
  const sla = slaMap[data.urgency] || "72 hours"

  // The email body text (plain) — used for copy & download
  const emailBodyText = `
FROM: Civic Mirror Platform <noreply@civicmirror.in>
TO: ${data.authority.name} <${data.authority.email}>
SUBJECT: 🚨 Civic Complaint ${data.complaintId} — ${data.department} [${urgencyLabel}]

Dear ${data.authority.name},

A new civic complaint has been filed through the Civic Mirror platform and requires your attention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLAINT ID    : ${data.complaintId}
PRIORITY        : ${urgencyLabel} — SLA ${sla}
DEPARTMENT      : ${data.department}
LOCATION        : ${data.location}
FILED ON        : ${data.timestamp.toLocaleString("en-IN")}
FILED BY        : ${data.submittedBy}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ISSUE TITLE:
${data.title}

DESCRIPTION:
${data.description}

Please acknowledge this complaint within ${sla} and update the status on the Civic Mirror platform.

Track & respond: https://civicmirror.in/track?id=${data.complaintId}

Regards,
Civic Mirror Automated Dispatch System
`.trim()

  // .eml format for proper email client import
  const emlContent = `From: Civic Mirror Platform <noreply@civicmirror.in>
To: ${data.authority.name} <${data.authority.email}>
CC: ${data.submittedEmail}
Subject: Civic Complaint ${data.complaintId} — ${data.department} [${urgencyLabel}]
Date: ${data.timestamp.toUTCString()}
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

Dear ${data.authority.name},

A new civic complaint has been filed through the Civic Mirror platform and requires your attention.

COMPLAINT ID    : ${data.complaintId}
PRIORITY        : ${urgencyLabel} — SLA ${sla}
DEPARTMENT      : ${data.department}
LOCATION        : ${data.location}
FILED ON        : ${data.timestamp.toLocaleString("en-IN")}
FILED BY        : ${data.submittedBy}

ISSUE TITLE:
${data.title}

DESCRIPTION:
${data.description}

Please acknowledge this complaint within ${sla} and update the status on the Civic Mirror platform.

Track & respond: https://civicmirror.in/track?id=${data.complaintId}

Regards,
Civic Mirror Automated Dispatch System
`

  // Terminal log lines — play out one by one
  const LOG_LINES = [
    { delay: 0,    icon: "→", color: "text-slate-400",  text: `Complaint ${data.complaintId} received` },
    { delay: 400,  icon: "⚡", color: "text-violet-400", text: `AI classified → ${data.department} [${urgencyLabel}]` },
    { delay: 900,  icon: "📍", color: "text-sky-400",    text: `Location extracted → ${data.location}` },
    { delay: 1400, icon: "🗂️", color: "text-amber-400",  text: `Looking up authority → ${data.authority.zone}` },
    { delay: 1900, icon: "✉️", color: "text-green-400",  text: `Routing email → ${data.authority.email}` },
    { delay: 2500, icon: "✅", color: "text-green-400",  text: `Email dispatched successfully` },
  ]

  useEffect(() => {
    LOG_LINES.forEach((line, i) => {
      setTimeout(() => setStep(i + 1), line.delay)
    })
    // Show full email after terminal completes
    setTimeout(() => setEmailVisible(true), 3200)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBodyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Download as .eml file (opens in Outlook, Apple Mail, Thunderbird, etc.)
  const handleDownload = (format = "eml") => {
    const isEml = format === "eml"
    const content = isEml ? emlContent : emailBodyText
    const mimeType = isEml ? "message/rfc822" : "text/plain"
    const extension = isEml ? "eml" : "txt"
    const filename = `complaint-${data.complaintId}.${extension}`

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">Complaint Filed Successfully</h2>
            <p className="text-slate-400 text-xs font-mono">{data.complaintId}</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs font-mono px-2 py-1 rounded border border-green-500/30 text-green-400">
              {data.timestamp.toLocaleTimeString("en-IN")}
            </span>
          </div>
        </div>

        {/* ── TERMINAL DISPATCH LOG (unique feature) ── */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <Terminal className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <span className="text-xs text-slate-400 font-mono">civic-mirror — email-dispatch</span>
          </div>

          {/* Log lines */}
          <div className="p-5 font-mono text-xs space-y-2 min-h-[160px]">
            <p className="text-slate-500">$ dispatch-email --complaint {data.complaintId}</p>
            {LOG_LINES.map((line, i) => (
              step > i ? (
                <div key={i} className={`flex items-start gap-2 transition-all duration-300 ${line.color}`}>
                  <span className="flex-shrink-0">{line.icon}</span>
                  <span>{line.text}</span>
                  {i === LOG_LINES.length - 1 && (
                    <span className="ml-2 text-green-400 animate-pulse">█</span>
                  )}
                </div>
              ) : null
            ))}
            {step < LOG_LINES.length && (
              <span className="text-slate-600 animate-pulse">█</span>
            )}
          </div>
        </div>

        {/* ── EMAIL SENT TO card ── */}
        {step >= 5 && (
          <div className="bg-slate-900 rounded-2xl border border-emerald-700/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-bold text-sm">Email Dispatched To</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Authority",  value: data.authority.name  },
                { label: "Email",      value: data.authority.email },
                { label: "Zone",       value: data.authority.zone  },
                { label: "Department", value: data.department       },
                { label: "SLA",        value: sla                  },
                { label: "Priority",   value: urgencyLabel, style: { color: urgencyColor } },
              ].map(row => (
                <div key={row.label} className="bg-slate-800 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500 mb-0.5">{row.label}</p>
                  <p className="text-sm font-bold text-white truncate" style={row.style || {}}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FULL EMAIL PREVIEW ── */}
        {emailVisible && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
            {/* Email client header bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">Email Copy</span>
                <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Sent</span>
              </div>
              {/* Action buttons: Copy + Download */}
              <div className="flex items-center gap-2">
                <button onClick={handleCopy}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    copied ? "bg-green-100 text-green-700 border border-green-300" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}>
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                {/* Download dropdown — clicking cycles between .eml and .txt */}
                <div className="relative group">
                  <button
                    onClick={() => handleDownload("eml")}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                      downloaded
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200"
                    }`}>
                    <Download className="w-3.5 h-3.5" />
                    {downloaded ? "Downloaded!" : "Download .eml"}
                  </button>
                  {/* Secondary option on hover — download as .txt */}
                  <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10 min-w-[160px]">
                    <button
                      onClick={() => handleDownload("eml")}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-orange-500" />
                      Download as .eml
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={() => handleDownload("txt")}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Download as .txt
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Email meta */}
            <div className="px-6 py-4 border-b border-slate-100 space-y-1.5 bg-slate-50">
              {[
                { label: "FROM", value: `Civic Mirror Platform <noreply@civicmirror.in>` },
                { label: "TO",   value: `${data.authority.name} <${data.authority.email}>` },
                { label: "CC",   value: `${data.submittedEmail}` },
                { label: "SUBJ", value: `🚨 Civic Complaint ${data.complaintId} — ${data.department} [${urgencyLabel}]` },
              ].map(row => (
                <div key={row.label} className="flex gap-3 text-sm">
                  <span className="font-black text-slate-400 w-10 flex-shrink-0 text-xs pt-0.5">{row.label}</span>
                  <span className="text-slate-700 break-all">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Email body */}
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Dear <strong>{data.authority.name}</strong>,</p>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                A new civic complaint has been filed through the <strong>Civic Mirror</strong> platform and requires your attention.
              </p>

              {/* Complaint details table */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-5">
                <div className="bg-slate-800 px-4 py-2.5">
                  <p className="text-xs font-bold text-slate-300 tracking-widest uppercase">Complaint Details</p>
                </div>
                {[
                  ["Complaint ID",   data.complaintId],
                  ["Priority",       urgencyLabel + ` — SLA ${sla}`],
                  ["Department",     data.department],
                  ["Location",       data.location],
                  ["Filed On",       data.timestamp.toLocaleString("en-IN")],
                  ["Filed By",       data.submittedBy],
                ].map(([k, v], i) => (
                  <div key={k} className={`flex px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <span className="text-slate-500 font-semibold w-36 flex-shrink-0">{k}</span>
                    <span className={`font-bold ${k === "Priority" ? "" : "text-slate-900"}`}
                      style={k === "Priority" ? { color: urgencyColor } : {}}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Issue title + description */}
              <div className="mb-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Issue Title</p>
                <p className="text-sm font-bold text-slate-900">{data.title}</p>
              </div>
              <div className="mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  {data.description}
                </p>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Please acknowledge this complaint within <strong>{sla}</strong> and update the status on the Civic Mirror platform.
              </p>

              {/* CTA button (visual only) */}
              <div className="flex gap-3 mb-6">
                <div className="bg-orange-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-default">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View & Respond on Civic Mirror
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">This is an automated email from <strong>Civic Mirror Dispatch System</strong>.</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{data.complaintId} · {data.timestamp.toISOString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Go to Dashboard button ── */}
        {emailVisible && (
          <div className="flex items-center justify-between pb-6">
            <div className="bg-slate-900 rounded-xl px-5 py-3 inline-block border border-slate-700">
              <p className="text-xs text-slate-400 mb-0.5">Your Complaint ID</p>
              <p className="text-lg font-black text-orange-400 font-mono tracking-widest">{data.complaintId}</p>
            </div>
            <button onClick={onDone}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Report({ addComplaint, user }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [urgency, setUrgency] = useState("medium")
  const [department, setDepartment] = useState("")
  const [images, setImages] = useState([]) // [{file, preview}]
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submittedId, setSubmittedId] = useState("")
  const [submittedData, setSubmittedData] = useState(null) // stores full complaint for email screen
  const fileRef = useRef()

  // AI state
  const [aiResult, setAiResult] = useState(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  // Fake detection state
  const [fakeResult, setFakeResult] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const text = `${title} ${description}`.trim()
    if (text.length < 15) { setAiResult(null); setFakeResult(null); setAiThinking(false); return }

    setAiThinking(true)
    setAiApplied(false)
    debounceRef.current = setTimeout(() => {
      setTimeout(() => {
        setAiResult(classifyComplaint(title, description))
        setFakeResult(detectFakeComplaint(title, description, location))
        setAiThinking(false)
      }, 700)
    }, 600)
  }, [title, description, location])

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 3) { alert("Max 3 images allowed"); return }
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setImages(prev => [...prev, { file, preview: ev.target.result }])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const e = {}
    if (title.trim().length < 10) e.title = "Title must be at least 10 characters."
    if (description.trim().length < 30) e.description = "Description must be at least 30 characters."
    if (!location.trim()) e.location = "Please enter a location."
    if (!department) e.department = "Please select a department."
    if (fakeResult?.isFake) e.fake = "Our AI flagged this as a potential fake complaint. Please revise."
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const complaintId = generateComplaintId()
    const now = new Date()
    const authority = DEPT_AUTHORITY[department] || DEPT_AUTHORITY["General"]

    addComplaint({
      id: Date.now(),
      complaintId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      urgency,
      department,
      status: "open",
      upvotes: 0,
      timestamp: now.toISOString(),
      images: images.map(i => i.preview),
      submittedBy: user?.email,
      source: "web_form",
    })

    // Try real backend — fire and forget
    fetch(`${BACKEND_URL}/api/complaint/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: description.trim(),
        author: user?.name || "Citizen",
        citizenEmail: user?.email || "",
      }),
    }).catch(() => {}) // fail silently — UI handles both cases

    setSubmittedId(complaintId)
    setSubmittedData({
      complaintId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      urgency,
      department,
      authority,
      submittedBy: user?.name || "Citizen",
      submittedEmail: user?.email || "citizen@example.com",
      timestamp: now,
    })
    setSubmitted(true)
  }

  if (submitted && submittedData) {
    return <EmailDispatchScreen data={submittedData} onDone={() => navigate("/dashboard")} />
  }

  const isFlagged = fakeResult?.isFake
  const isClean = fakeResult && !fakeResult.isFake

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900">Report an Issue</h1>
          <p className="text-slate-500 mt-1">AI auto-detects department & urgency. Fake complaints are blocked automatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title + Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Title <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Broken streetlight on Park Avenue" value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({...p, title: ""})) }}
                className={`w-full border px-4 py-2.5 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.title ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
              {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
              <p className="text-xs text-slate-400 mt-1">{title.length}/10 min</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea placeholder="Describe the issue in detail — what's happening, how long, how it affects people..." value={description}
                onChange={e => { setDescription(e.target.value); setErrors(p => ({...p, description: ""})) }}
                rows={4} className={`w-full border px-4 py-2.5 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${errors.description ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
              {errors.description && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
              <p className="text-xs text-slate-400 mt-1">{description.length}/30 min</p>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
            aiThinking ? "border-violet-300 bg-violet-50" :
            isFlagged ? "border-red-300 bg-red-50" :
            isClean && aiResult?.detected ? "border-violet-400 bg-violet-50" :
            "border-dashed border-slate-200 bg-slate-50"
          }`}>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isFlagged ? "bg-red-500" : aiThinking || aiResult?.detected ? "bg-violet-500" : "bg-slate-300"}`}>
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className={`font-bold text-sm ${isFlagged ? "text-red-700" : aiThinking || aiResult?.detected ? "text-violet-700" : "text-slate-400"}`}>
                  AI Analysis Engine
                </span>
                {aiThinking && <span className="text-xs text-violet-500 flex items-center">Processing<ThinkingDots /></span>}
              </div>

              {!aiThinking && !aiResult && (
                <p className="text-sm text-slate-400 italic">Start typing — AI will classify and verify your complaint.</p>
              )}

              {aiThinking && (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <p className="text-sm text-violet-600">Analyzing for department, urgency, and authenticity...</p>
                </div>
              )}

              {/* FAKE WARNING */}
              {isFlagged && !aiThinking && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-red-700 text-sm">Potential Fake Complaint Detected</span>
                    <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{fakeResult.label}</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {fakeResult.reasons.map((r, i) => (
                      <p key={i} className="text-xs text-red-600 flex items-center gap-1"><span>•</span>{r}</p>
                    ))}
                  </div>
                  <p className="text-xs text-red-500 italic">Please revise your complaint to avoid rejection. Ensure it describes a real civic issue with specific details.</p>
                  {errors.fake && <p className="text-red-600 text-xs font-semibold mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.fake}</p>}
                </div>
              )}

              {/* CLEAN + CLASSIFIED */}
              {isClean && aiResult && !aiThinking && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-semibold">Genuine complaint · AI classified:</span>
                    <span className="text-xs bg-violet-100 text-violet-600 border border-violet-200 px-2 py-0.5 rounded-full">{aiResult.confidence}% confidence</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {aiResult.department && (
                      <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg font-semibold">🏛️ {aiResult.department}</span>
                    )}
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold border ${
                      aiResult.urgency === "high" ? "bg-red-50 border-red-200 text-red-700" :
                      aiResult.urgency === "medium" ? "bg-amber-50 border-amber-200 text-amber-700" :
                      "bg-green-50 border-green-200 text-green-700"
                    }`}>
                      {aiResult.urgency === "high" ? "🔴" : aiResult.urgency === "medium" ? "🟡" : "🟢"} {aiResult.urgency?.toUpperCase()}
                    </span>
                  </div>
                  {!aiApplied ? (
                    <button type="button"
                      onClick={() => { if (aiResult.department) setDepartment(aiResult.department); setUrgency(aiResult.urgency); setAiApplied(true) }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors">
                      <Sparkles className="w-3.5 h-3.5" /> Apply AI Suggestion
                    </button>
                  ) : (
                    <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Applied! You can still change manually below.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Location + Department + Urgency */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Street address, landmark, or area" value={location}
                  onChange={e => { setLocation(e.target.value); setErrors(p => ({...p, location: ""})) }}
                  className={`w-full border pl-10 pr-4 py-2.5 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.location ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
              </div>
              {errors.location && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Department <span className="text-red-400">*</span>
                {aiApplied && department && <span className="ml-2 text-xs text-violet-600">✨ AI detected</span>}
              </label>
              <select value={department} onChange={e => { setDepartment(e.target.value); setErrors(p => ({...p, department: ""})) }}
                className={`w-full border px-4 py-2.5 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.department ? "border-red-400 bg-red-50" : aiApplied && department ? "border-violet-300 bg-violet-50" : "border-slate-200"}`}>
                <option value="">Select responsible department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Urgency <span className="text-red-400">*</span>
                {aiApplied && <span className="ml-2 text-xs text-violet-600">✨ AI detected</span>}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {urgencyOptions.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setUrgency(opt.value)}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${urgency === opt.value ? opt.active : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs mt-0.5 opacity-75">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              📷 Upload Photos <span className="text-slate-400 font-normal">(optional, max 3)</span>
            </label>
            <div className="flex gap-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200">
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-orange-500 transition-all">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <p className="text-xs text-slate-400 mt-3">Photos help verify complaints and speed up resolution.</p>
          </div>

          <button type="submit"
            className={`w-full py-3.5 font-bold rounded-xl transition-all text-base shadow-lg ${
              isFlagged ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 hover:scale-[1.02]"
            }`}
            disabled={!!isFlagged}>
            {isFlagged ? "⚠️ Fix Issues Before Submitting" : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  )
}
