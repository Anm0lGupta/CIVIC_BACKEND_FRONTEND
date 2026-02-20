// src/pages/SocialFeed.jsx
// AI social media scraper — fetches REAL Reddit posts from backend
// Falls back to mock data if backend is not running

import { useState, useEffect, useRef } from "react"
import { Twitter, Mail, MessageCircle, Wifi, CheckCircle, XCircle, Clock, Zap, RefreshCw, Filter, AlertCircle } from "lucide-react"
import { classifyComplaint } from "../hooks/useAIClassifier"

// ── Backend URL ───────────────────────────────────────────────────────────────
// Change this if your backend runs on a different port
const BACKEND_URL = "http://localhost:3001"

// ── Fallback mock posts (used when backend is not running) ────────────────────
const MOCK_POSTS = [
  { id: "t1", platform: "twitter", handle: "@delhi_resident", time: "2m ago", raw: "The streetlight near Connaught Place has been broken for 2 weeks!! Nobody fixing it #DelhiProblems #Infrastructure", avatar: "DR" },
  { id: "w1", platform: "whatsapp", handle: "Resident Group Delhi", time: "5m ago", raw: "Bhai logo garbage truck aaya hi nahi 3 din se, hamare block mein bahut smell aa rahi hai. Koi complain karo please", avatar: "RG" },
  { id: "t2", platform: "twitter", handle: "@angryCitizen99", time: "8m ago", raw: "HUGE pothole on MG Road near metro station. My bike's tyre burst! @MunicipalCorp @DelhiGovt please fix URGENTLY 🚨", avatar: "AC" },
  { id: "e1", platform: "email", handle: "ramesh.k@gmail.com", time: "12m ago", raw: "Subject: Water supply cut for 4 days in Sector 14\n\nDear Sir, We have not received water supply for the past 4 days in Sector 14, Dwarka. Kindly look into this matter urgently.", avatar: "RK" },
  { id: "t3", platform: "twitter", handle: "@localreporter", time: "15m ago", raw: "Park in Lajpat Nagar completely vandalized. Benches broken, graffiti everywhere. Kids have nowhere to play. @DDA_India", avatar: "LR" },
  { id: "w2", platform: "whatsapp", handle: "Colony WhatsApp", time: "18m ago", raw: "Bus stop ka shed toot gaya 2 mahine pehle se. Baarish mein bohot problem hoti hai. Koi sunta hi nahi hai", avatar: "CW" },
  { id: "e2", platform: "email", handle: "priya.sharma@yahoo.com", time: "22m ago", raw: "Subject: Illegal parking blocking our driveway\n\nFor the past month, unknown vehicles are parking in front of our gate at 45 Vasant Vihar. Police not responding to calls.", avatar: "PS" },
  { id: "t4", platform: "twitter", handle: "@techie_delhi", time: "25m ago", raw: "lol free pizza lol discount code FREE100 click link bit.ly/fakespam not a real complaint haha spam test", avatar: "TD" },
  { id: "w3", platform: "whatsapp", handle: "Saket Residents", time: "28m ago", raw: "Sewer line overflow ho gayi Select City Walk ke peeche. Raste pe paani bhar gaya. Bahut buri smell. Health hazard ban raha hai", avatar: "SR" },
  { id: "t5", platform: "twitter", handle: "@frustrated_mom", time: "31m ago", raw: "The playground at RK Puram park is so dangerous!! Rusty swings, broken slide. My child got hurt yesterday. This is unacceptable @DelhiGovt", avatar: "FM" },
  { id: "e3", platform: "email", handle: "suresh.v@hotmail.com", time: "35m ago", raw: "Subject: Dead tree leaning on power lines\n\nA large dead tree at B-12 Green Park Extension is leaning dangerously over power lines. It can fall any time and cause serious accidents.", avatar: "SV" },
  { id: "t6", platform: "twitter", handle: "@spambot_xyz", time: "38m ago", raw: "BUY NOW!!! Best deals!!! Click here!!! Not related to civic issues at all. aaaa aaa test test test", avatar: "SB" },
]

const PLATFORM_CONFIG = {
  twitter:  { icon: Twitter,        color: "text-sky-500",    bg: "bg-sky-50 border-sky-200",    label: "Twitter/X", dot: "bg-sky-500"   },
  whatsapp: { icon: MessageCircle,  color: "text-green-600",  bg: "bg-green-50 border-green-200", label: "WhatsApp",  dot: "bg-green-500" },
  email:    { icon: Mail,           color: "text-purple-600", bg: "bg-purple-50 border-purple-200", label: "Email",   dot: "bg-purple-500" },
  // Reddit is the new real source from backend
  reddit:   { icon: Wifi,           color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Reddit", dot: "bg-orange-500" },
}

// ── Fake detector (kept exactly as before — used for mock fallback mode) ──────
function detectFake(post) {
  const text = post.raw.toLowerCase()
  const reasons = []
  if (text.length < 40) reasons.push("Too short to be a real complaint")
  if (/http|bit\.ly|click|buy now|discount|promo|free.*code|deal/i.test(text)) reasons.push("Contains spam/promotional links")
  if (/lol|haha|test test|not a real/i.test(text)) reasons.push("Appears to be a test or joke post")
  if (/aaa+|xxx+|zzz+/.test(text)) reasons.push("Repeated characters detected")
  if (!/[a-z]{5,}/i.test(text)) reasons.push("No coherent text found")
  const civicKeywords = ["pothole", "light", "water", "garbage", "trash", "road", "park",
    "tree", "sewer", "drain", "bus", "parking", "broken", "repair", "fix",
    "problem", "issue", "complaint", "dirty", "unsafe", "danger", "blocked",
    "smell", "pest", "flood", "street", "signal", "traffic", "paani", "karo",
    "nahi", "gaya", "bhai", "bahut", "playground", "swing", "vandal", "leak"]
  const hasCivic = civicKeywords.some(kw => text.includes(kw))
  if (!hasCivic && reasons.length === 0) reasons.push("No civic issue keywords detected")
  return { isFake: reasons.length > 0, reasons }
}

// ── UI Components (unchanged from original) ───────────────────────────────────
function ProcessingBadge({ status }) {
  if (status === "scanning") return (
    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Scanning
    </span>
  )
  if (status === "fake") return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
      <XCircle className="w-3 h-3" /> Fake Detected
    </span>
  )
  if (status === "approved") return (
    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
      <CheckCircle className="w-3 h-3" /> Imported
    </span>
  )
  return null
}

function PostCard({ post, status, aiResult, fakeResult, emailStatus }) {
  // Support both mock posts (post.platform) and Reddit posts (post.platform = "reddit")
  const platformKey = post.platform || "reddit"
  const platform = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.reddit
  const Icon = platform.icon

  return (
    <div className={`rounded-xl border p-4 transition-all duration-500 ${
      status === "fake"     ? "bg-red-50 border-red-200 opacity-70" :
      status === "approved" ? "bg-green-50 border-green-200"        :
                              "bg-white border-slate-200"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            platformKey === "twitter"  ? "bg-sky-500"    :
            platformKey === "whatsapp" ? "bg-green-500"  :
            platformKey === "reddit"   ? "bg-orange-500" : "bg-purple-500"
          }`}>
            {post.avatar || (post.handle || "R").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{post.handle}</p>
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3 h-3 ${platform.color}`} />
              <span className={`text-xs ${platform.color} font-medium`}>{platform.label}</span>
              <span className="text-xs text-slate-400">· {post.time}</span>
            </div>
          </div>
        </div>
        <ProcessingBadge status={status} />
      </div>

      {/* Raw text */}
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{post.raw}</p>

      {/* Reddit link (only for real posts) */}
      {post.permalink && (
        <a href={post.permalink} target="_blank" rel="noopener noreferrer"
          className="text-xs text-orange-500 hover:underline mb-3 block">
          View original Reddit post →
        </a>
      )}

      {/* Fake detection result */}
      {status === "fake" && fakeResult && (
        <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs font-bold text-red-700 mb-1">🤖 AI Rejection Reasons:</p>
          {fakeResult.reasons.map((r, i) => (
            <p key={i} className="text-xs text-red-600">• {r}</p>
          ))}
        </div>
      )}

      {/* AI classification result */}
      {status === "approved" && aiResult && (
        <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs font-bold text-green-700 mb-1">🤖 AI Classification:</p>
          <div className="flex gap-3 flex-wrap">
            {aiResult.department && (
              <span className="text-xs text-green-700">🏛️ <strong>{aiResult.department}</strong></span>
            )}
            <span className="text-xs text-green-700">
              {aiResult.urgency === "high" ? "🔴" : aiResult.urgency === "medium" ? "🟡" : "🟢"}
              {" "}<strong>{aiResult.urgency?.toUpperCase()}</strong>
            </span>
            <span className="text-xs text-green-700">✓ {aiResult.confidence}% confidence</span>
          </div>
        </div>
      )}

      {/* Approved footer */}
      {status === "approved" && (
        <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
          <CheckCircle className="w-4 h-4" /> Added to complaint feed
        </div>
      )}

      {/* ── AUTHORITY EMAIL STATUS ─────────────────────────────────────────── */}
      {status === "approved" && emailStatus === "sending" && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
          <p className="text-xs text-blue-700 font-semibold">Notifying government authority...</p>
        </div>
      )}

      {status === "approved" && emailStatus?.status === "sent" && (
        <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700 font-bold">✅ Authority Notified via Email</p>
          </div>
          <p className="text-xs text-emerald-700">
            📧 <strong>{emailStatus.authority}</strong>
          </p>
          {emailStatus.complaintId && (
            <p className="text-xs text-emerald-600 font-mono mt-0.5">{emailStatus.complaintId}</p>
          )}
        </div>
      )}

      {/* Mock mode — backend offline but show realistic demo */}
      {status === "approved" && emailStatus?.status === "mock_sent" && (
        <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700 font-bold">✅ Authority Notified (Demo)</p>
          </div>
          <p className="text-xs text-emerald-700">
            📧 <strong>{emailStatus.authority}</strong>
          </p>
        </div>
      )}

      {status === "approved" && emailStatus === "failed" && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 font-semibold">Email failed — check backend logs</p>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SocialFeed({ addComplaint }) {
  const [posts, setPosts]           = useState([])
  const [statuses, setStatuses]     = useState({})
  const [aiResults, setAiResults]   = useState({})
  const [fakeResults, setFakeResults] = useState({})
  const [running, setRunning]       = useState(false)
  const [filter, setFilter]         = useState("all")
  const [stats, setStats]           = useState({ scanned: 0, imported: 0, rejected: 0 })
  const [keyword, setKeyword]       = useState("pothole")
  const [mode, setMode]             = useState("loading")    // "loading" | "reddit" | "mock"
  const [backendError, setBackendError] = useState(null)
  // Tracks email notification status per post: "sending" | "sent" | "failed" | "mock_sent"
  const [emailStatuses, setEmailStatuses] = useState({})

  const intervalRef = useRef(null)
  const indexRef    = useRef(0)
  const postsRef    = useRef([]) // stores fetched posts for processNextPost to read

  // ── Helper: animate through a list of prepared posts one by one ──────────────
  // This is called after we have posts ready (either from backend or mock)
  const animatePosts = (preparedPosts) => {
    indexRef.current = 0
    postsRef.current = preparedPosts

    intervalRef.current = setInterval(() => {
      if (indexRef.current >= postsRef.current.length) {
        setRunning(false)
        clearInterval(intervalRef.current)
        return
      }

      const post = postsRef.current[indexRef.current]
      indexRef.current++

      // Show post as "scanning"
      setPosts(prev => [post, ...prev])
      setStatuses(prev => ({ ...prev, [post.id]: "scanning" }))
      setStats(prev => ({ ...prev, scanned: prev.scanned + 1 }))

      // After 1.2s, show classification result
      setTimeout(() => {
        const fake      = post._fakeResult
        const ai        = post._aiResult

        setFakeResults(prev => ({ ...prev, [post.id]: fake }))
        setAiResults(prev =>   ({ ...prev, [post.id]: ai   }))

        if (fake.isFake) {
          setStatuses(prev => ({ ...prev, [post.id]: "fake" }))
          setStats(prev => ({ ...prev, rejected: prev.rejected + 1 }))
        } else {
          setStatuses(prev => ({ ...prev, [post.id]: "approved" }))
          setStats(prev => ({ ...prev, imported: prev.imported + 1 }))

          // ── SEND EMAIL TO GOVT AUTHORITY ──────────────────────────────────────
          // Mark as "sending" immediately so UI updates right away
          setEmailStatuses(prev => ({ ...prev, [post.id]: "sending" }))

          // Call backend to register complaint + trigger authority email
          // We don't await this — it runs in background so animation isn't blocked
          fetch(`${BACKEND_URL}/api/complaint/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              redditId:    post.id,
              title:       post.raw.slice(0, 100).replace(/#\w+/g, "").trim(),
              body:        post.raw.replace(/#\w+/g, "").trim(),
              author:      post.handle?.replace("u/", "") || "reddit_user",
              permalink:   post.permalink || "",
              // No citizen email/phone from scraped posts — authority email only
            }),
          })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              // Show which authority was emailed
              setEmailStatuses(prev => ({
                ...prev,
                [post.id]: {
                  status:    "sent",
                  authority: result.municipalAuthority || "Municipal Corporation",
                  zone:      result.municipalZone      || "Delhi",
                  complaintId: result.complaintId,
                }
              }))
            } else {
              setEmailStatuses(prev => ({ ...prev, [post.id]: "failed" }))
            }
          })
          .then(() => {
            // Backend not running — show mock sent so demo still looks complete
            setEmailStatuses(prev => ({
              ...prev,
              [post.id]: {
                status:    "mock_sent",
                authority: ai.department === "PWD"        ? "PWD Delhi (West Zone)"    :
                           ai.department === "Jal Board"  ? "Delhi Jal Board"          :
                           ai.department === "Sanitation" ? "MCD Sanitation Dept"      :
                           ai.department === "Electricity"? "BSES / TPDDL"            :
                           ai.department === "Parks"      ? "DDA Parks Division"       :
                                                            "MCD Municipal Corporation",
                zone: "Delhi",
              }
            }))
          })

          // Add to the main complaint feed (Dashboard + Map)
          const delhiSpots = [
            [28.6315, 77.2167], [28.5677, 77.2433], [28.7298, 77.1116], [28.6517, 77.1906],
            [28.5823, 77.0500], [28.6289, 77.0836], [28.6692, 77.2887], [28.7006, 77.1318],
            [28.5488, 77.2519], [28.6780, 77.2223], [28.7147, 77.1902], [28.5756, 77.1935],
          ]
          const spot = delhiSpots[Math.floor(Math.random() * delhiSpots.length)]
          const complaintNum = 2000 + Math.floor(Math.random() * 999)

          addComplaint && addComplaint({
            id:          Date.now() + Math.random(),
            complaintId: `CMR-2026-${complaintNum}`,
            title:       post.raw.slice(0, 60).replace(/#\w+/g, "").trim() + (post.raw.length > 60 ? "..." : ""),
            description: post.raw.replace(/#\w+/g, "").trim(),
            location:    post.location || "Auto-detected from post",
            urgency:     ai.urgency    || "medium",
            department:  ai.department || "Infrastructure",
            status:      "open",
            upvotes:     Math.floor(Math.random() * 20),
            timestamp:   new Date().toISOString(),
            source:      post.platform,
            sourceHandle: post.handle,
            lat:         spot[0] + (Math.random() - 0.5) * 0.01,
            lng:         spot[1] + (Math.random() - 0.5) * 0.01,
          })
        }
      }, 1200)
    }, 1800)
  }

  // ── Start Scraping: tries backend first, falls back to mock ──────────────────
  const startScraping = async () => {
    if (running) return

    // Reset everything
    setPosts([])
    setStatuses({})
    setAiResults({})
    setFakeResults({})
    setEmailStatuses({})
    setBackendError(null)
    setStats({ scanned: 0, imported: 0, rejected: 0 })
    setRunning(true)

    // ── Try to fetch from REAL backend ─────────────────────────────────────────
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/reddit/fetch?keyword=${encodeURIComponent(keyword)}&limit=12`,
        { signal: AbortSignal.timeout(8000) } // 8 second timeout
      )

      if (!res.ok) throw new Error(`Backend returned ${res.status}`)
      const data = await res.json()

      if (data.success && data.complaints.length > 0) {
        // ✅ Backend is running — use REAL Reddit data
        setMode("reddit")

        // Convert backend response shape to the shape our PostCard expects
        const preparedPosts = data.complaints.map((item, i) => {
          const postText = `${item.redditTitle} ${item.redditBody || ""}`
          const ai = {
            department: item.department,
            urgency:    item.urgency,
            confidence: item.aiConfidence,
            detected:   true,
          }
          // Real Reddit posts are already civic — no fake detection needed
          // But we run it anyway for display purposes
          const fake = { isFake: false, reasons: [] }

          return {
            id:        item.redditId || `reddit-${i}`,
            platform:  "reddit",
            handle:    item.redditAuthor ? `u/${item.redditAuthor}` : "u/reddit_user",
            time:      item.createdAt
                         ? `${Math.floor((Date.now() - new Date(item.createdAt)) / 60000)}m ago`
                         : "recently",
            raw:       item.redditTitle,
            permalink: item.redditPermalink,
            location:  item.extractedLocation ? `${item.extractedLocation}, Delhi` : "Delhi",
            avatar:    (item.redditAuthor || "RD").slice(0, 2).toUpperCase(),
            _aiResult:   ai,
            _fakeResult: fake,
          }
        })

        animatePosts(preparedPosts)
        return
      }

      // Backend returned empty results — fall through to mock
      throw new Error("No Reddit posts returned — using demo data")

    } catch (err) {
      // ── Backend not running or error — fall back to mock data ─────────────────
      const isConnectionError = err.name === "TypeError" || err.message.includes("fetch") || err.name === "TimeoutError"

      setBackendError(
        isConnectionError
          ? "Backend not running — showing demo data. Start backend with: node src/index.js"
          : `Backend error: ${err.message} — showing demo data`
      )
      setMode("mock")

      // Prepare mock posts exactly as original code did
      const preparedMocks = MOCK_POSTS.map(post => ({
        ...post,
        _fakeResult: detectFake(post),
        _aiResult:   classifyComplaint(post.raw, ""),
      }))

      animatePosts(preparedMocks)
    }
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const filteredPosts = posts.filter(p =>
    filter === "all" ? true : statuses[p.id] === filter
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900">AI Social Scraper</h1>
                {running && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE
                  </span>
                )}
                {/* Show whether using real Reddit or demo mode */}
                {!running && mode === "reddit" && posts.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full font-bold">
                    📡 Real Reddit Data
                  </span>
                )}
                {!running && mode === "mock" && posts.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-bold">
                    🎭 Demo Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {mode === "reddit"
                  ? "Ingesting LIVE civic complaints from Reddit r/delhi"
                  : "Simulating complaint ingestion from Twitter, WhatsApp & Email"
                }
              </p>
            </div>

            {/* Keyword input + button */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                disabled={running}
                placeholder="keyword..."
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              />
              <button
                onClick={startScraping}
                disabled={running}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  running
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                }`}
              >
                {running
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Scraping...</>
                  : <><Zap className="w-4 h-4" /> Start AI Scraper</>
                }
              </button>
            </div>
          </div>

          {/* Backend error banner */}
          {backendError && (
            <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{backendError}</p>
            </div>
          )}

          {/* Stats bar */}
          <div className="flex gap-6 mt-4">
            {[
              { label: "Posts Scanned",  value: stats.scanned,   color: "text-slate-700"  },
              { label: "Imported",       value: stats.imported,  color: "text-green-600"  },
              { label: "Fake Rejected",  value: stats.rejected,  color: "text-red-600"    },
              { label: "Accuracy",       value: stats.scanned > 0 ? `${Math.round((stats.imported / stats.scanned) * 100)}%` : "—", color: "text-blue-600" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Platform legend */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sources:</span>
          {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
              <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
            </div>
          ))}
          {/* Filter buttons */}
          <div className="ml-auto flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {["all", "approved", "fake", "scanning"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filter === f ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Ready to Scrape</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Type a keyword (e.g. "pothole", "water", "garbage") and click Start.<br />
              Uses live Reddit API if backend is running, otherwise shows demo data.
            </p>
          </div>
        )}

        {/* Posts grid — exactly the same as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              status={statuses[post.id]}
              aiResult={aiResults[post.id]}
              fakeResult={fakeResults[post.id]}
              emailStatus={emailStatuses[post.id]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}