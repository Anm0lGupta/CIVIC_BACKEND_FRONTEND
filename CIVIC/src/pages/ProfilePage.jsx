// src/pages/ProfilePage.jsx
// Shows user Citizen ID, complaint history, stats

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Copy, CheckCircle, LogOut, User2, FileText, Clock } from "lucide-react"

function formatDate(ts) {
  if (!ts) return "—"
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

function formatTimeAgo(ts) {
  if (!ts || ts === "Just now") return "Just now"
  const d = Math.floor((new Date() - new Date(ts)) / 86400000)
  if (d === 0) return "Today"
  if (d === 1) return "Yesterday"
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

const statusStyle = {
  open:        { bg: "bg-blue-100",   text: "text-blue-700",   label: "Open" },
  in_progress: { bg: "bg-purple-100", text: "text-purple-700", label: "In Progress" },
  resolved:    { bg: "bg-green-100",  text: "text-green-700",  label: "Resolved" },
}

const urgencyStyle = {
  high:   "text-red-600",
  medium: "text-amber-600",
  low:    "text-green-600",
}

export default function ProfilePage({ user, onLogout, complaints }) {
  const navigate = useNavigate()
  const [copiedId, setCopiedId] = useState(false)

  const mine     = (complaints || []).filter(c => c.submittedBy === user?.email)
  const resolved = mine.filter(c => c.status === "resolved").length
  const open     = mine.filter(c => c.status === "open").length
  const inProg   = mine.filter(c => c.status === "in_progress").length

  const handleCopyCitizenId = () => {
    if (!user?.citizenId) return
    navigator.clipboard.writeText(user.citizenId).then(() => {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-xl mx-auto space-y-5">

        <h1 className="text-3xl font-black text-slate-900">My Profile</h1>

        {/* Identity card */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-xl font-black">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-lg font-black">{user?.name}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <p className="text-slate-500 text-xs mt-0.5">Member since {formatDate(user?.joinedAt)}</p>
            </div>
          </div>

          {/* Citizen ID */}
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User2 className="w-3.5 h-3.5 text-orange-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Citizen ID</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xl font-black text-orange-400 tracking-widest">
                {user?.citizenId || "CIZ-????????"}
              </span>
              <button
                onClick={handleCopyCitizenId}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg font-semibold transition-colors"
              >
                {copiedId
                  ? <><CheckCircle className="w-3 h-3" /> Copied!</>
                  : <><Copy className="w-3 h-3" /> Copy</>
                }
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Share this ID with the admin to verify you filed a complaint.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Filed", value: mine.length,       color: "text-orange-500" },
            { label: "Resolved",    value: resolved,           color: "text-green-500" },
            { label: "Pending",     value: open + inProg,      color: "text-amber-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Complaint list */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" /> My Complaints
            </h2>
            <button
              onClick={() => navigate("/report")}
              className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
            >
              + New Report
            </button>
          </div>

          {mine.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">You haven't filed any complaints yet.</p>
              <button onClick={() => navigate("/report")}
                className="mt-3 text-orange-500 text-sm font-semibold hover:text-orange-600">
                Report your first issue →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {mine.slice().reverse().map(c => {
                const st = statusStyle[c.status] || statusStyle.open
                return (
                  <div key={c.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {c.complaintId && (
                          <span className="text-xs font-mono font-bold text-orange-500">{c.complaintId} · </span>
                        )}
                        <span className="text-sm font-semibold text-slate-800">{c.title}</span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatTimeAgo(c.timestamp)}
                          </span>
                          {c.department && <span className="text-xs text-slate-400">· {c.department}</span>}
                          <span className={`text-xs font-bold ${urgencyStyle[c.urgency] || ""}`}>
                            · {c.urgency?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        <button
                          onClick={() => navigate(`/track?id=${c.complaintId}`)}
                          className="text-xs text-orange-500 hover:text-orange-600 font-semibold"
                        >
                          Track →
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Track shortcut banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800 text-sm mb-1">Track any complaint by ID</p>
            <p className="text-xs text-slate-500">Enter CMR-2026-XXXX to check live status</p>
          </div>
          <button
            onClick={() => navigate("/track")}
            className="flex-shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Track →
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full py-3 bg-white hover:bg-red-50 text-red-600 font-semibold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>

      </div>
    </div>
  )
}