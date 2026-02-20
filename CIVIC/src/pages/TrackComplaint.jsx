// src/pages/TrackComplaint.jsx
// FIX: Stale closure bug fixed — sample ID buttons now work correctly
// FIX: Supports /track?id=CMR-2026-1001 from Profile page links
// FIX: Theme consistent with app (orange, not dark)

import { useState, useEffect } from "react"
import { Search, CheckCircle, Clock, AlertCircle, MapPin, Building2, ThumbsUp, ArrowLeft, Download, Shield } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { downloadComplaintPDF } from "../hooks/usePDFReport"

const statusSteps = [
  { key: "submitted",    label: "Submitted",    desc: "Complaint received by system",  icon: CheckCircle },
  { key: "under_review", label: "Under Review", desc: "Department notified",            icon: Search },
  { key: "in_progress",  label: "In Progress",  desc: "Work order raised",             icon: Clock },
  { key: "resolved",     label: "Resolved",     desc: "Issue fixed and closed",        icon: CheckCircle },
]

function getStepsDone(status) {
  if (status === "resolved")    return 4
  if (status === "in_progress") return 3
  if (status === "open")        return 2
  return 1
}

const urgencyConfig = {
  high:   { bg: "bg-red-100",   text: "text-red-700",   border: "border-red-200",   label: "HIGH URGENCY" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", label: "MEDIUM URGENCY" },
  low:    { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", label: "LOW URGENCY" },
}

const statusConfig = {
  open:        { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   label: "Open — Awaiting Action" },
  in_progress: { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", label: "In Progress" },
  resolved:    { color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  label: "Resolved ✓" },
}

function isNeglected(c) {
  if (c.status === "resolved" || c.timestamp === "Just now") return false
  return Math.floor((new Date() - new Date(c.timestamp)) / 86400000) >= 30
}

function formatDate(ts) {
  if (!ts || ts === "Just now") return "Just now"
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

function StatusTimeline({ status }) {
  const done = getStepsDone(status)
  return (
    <div className="relative pl-4">
      {/* Background track */}
      <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-200" />
      {/* Progress fill */}
      <div
        className="absolute left-8 top-4 w-0.5 bg-orange-500 transition-all duration-700"
        style={{ height: `${((done - 1) / (statusSteps.length - 1)) * 100}%` }}
      />
      <div className="space-y-7 relative">
        {statusSteps.map((step, i) => {
          const isDone   = i < done
          const isActive = i === done - 1
          const Icon     = step.icon
          return (
            <div key={step.key} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                isDone
                  ? isActive
                    ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30"
                    : "bg-green-500 border-green-500"
                  : "bg-white border-slate-200"
              }`}>
                {isDone
                  ? <Icon className="w-4 h-4 text-white" />
                  : <span className="w-2 h-2 rounded-full bg-slate-300 block" />
                }
              </div>
              <div className={`pt-1 ${isDone ? "" : "opacity-40"}`}>
                <p className={`font-bold text-sm ${isActive ? "text-orange-600" : isDone ? "text-green-700" : "text-slate-400"}`}>
                  {step.label}
                  {isActive && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Current</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SAMPLE_IDS = ["CMR-2026-1001", "CMR-2026-1007", "CMR-2026-1011", "CMR-2026-1015"]

export default function TrackComplaint({ complaints }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [inputId,     setInputId]     = useState(searchParams.get("id") || "")
  const [result,      setResult]      = useState(null)
  const [searched,    setSearched]    = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Search function takes value directly — avoids stale closure bug
  const doSearch = (idToSearch) => {
    const q = (idToSearch || "").trim()
    if (!q) return
    const found = (complaints || []).find(c =>
      c.complaintId?.toLowerCase() === q.toLowerCase() ||
      c.id?.toString() === q
    )
    setResult(found || null)
    setSearched(true)
  }

  // If URL has ?id= param, auto-search on mount
  useEffect(() => {
    const urlId = searchParams.get("id")
    if (urlId && complaints?.length) {
      setInputId(urlId)
      doSearch(urlId)
    }
  }, [complaints])

  const handleSubmit = (e) => { e?.preventDefault(); doSearch(inputId) }

  const handleDownload = async () => {
    if (!result) return
    setDownloading(true)
    try { await downloadComplaintPDF(result) } catch (e) { console.error(e) }
    setDownloading(false)
  }

  const neglected  = result && isNeglected(result)
  const urgency    = result ? (urgencyConfig[result.urgency] || urgencyConfig.medium) : null
  const statusCfg  = result ? (statusConfig[result.status]  || statusConfig.open)    : null

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header — consistent with app theme */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-orange-500 text-2xl font-black">⬡</span>
            <div>
              <p className="font-black text-slate-900 text-lg leading-none">Civic Mirror</p>
              <p className="text-slate-400 text-xs">Complaint Tracker</p>
            </div>
          </div>
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Search box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-1">Track Your Complaint</h2>
          <p className="text-slate-400 text-sm mb-5">
            Enter the complaint ID you received when submitting — e.g.{" "}
            <span className="font-mono text-orange-500 font-bold">CMR-2026-1001</span>
          </p>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="CMR-2026-XXXX"
                value={inputId}
                onChange={e => { setInputId(e.target.value); setSearched(false); setResult(null) }}
                className="w-full border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm placeholder-slate-300"
              />
            </div>
            <button type="submit"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95">
              Track
            </button>
          </form>

          {/* Sample IDs — FIX: pass id string directly to doSearch, no setTimeout */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Try:</span>
            {SAMPLE_IDS.map(id => (
              <button key={id}
                onClick={() => { setInputId(id); doSearch(id) }}
                className="font-mono text-xs text-orange-500 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors">
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Not found */}
        {searched && !result && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Complaint Not Found</h3>
            <p className="text-slate-400 text-sm mb-4">
              No complaint matches <span className="font-mono font-bold text-red-500">"{inputId}"</span>. Please check the ID.
            </p>
            <button
              onClick={() => { localStorage.removeItem("complaints"); window.location.reload() }}
              className="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition-colors"
            >
              🔄 Reset to fresh mock data
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">

            {neglected && (
              <div className="bg-red-600 text-white rounded-2xl px-5 py-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm">⚠️ Complaint neglected — No action for 30+ days</p>
                  <p className="text-red-200 text-xs">Department flagged for accountability review.</p>
                </div>
              </div>
            )}

            {/* Main card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`h-1.5 w-full ${result.urgency === "high" ? "bg-red-500" : result.urgency === "medium" ? "bg-orange-400" : "bg-green-500"}`} />

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                        {result.complaintId}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${urgency.bg} ${urgency.text} ${urgency.border}`}>
                        {urgency.label}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{result.title}</h3>
                  </div>
                </div>

                {/* Live status */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 ${statusCfg.bg} ${statusCfg.border}`}>
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    result.status === "resolved"    ? "bg-green-500" :
                    result.status === "in_progress" ? "bg-purple-500" : "bg-blue-500"
                  }`} />
                  <span className={`font-bold text-sm ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: Building2, label: "Department",        value: result.department || "—" },
                    { icon: MapPin,    label: "Location",          value: result.location },
                    { icon: Clock,     label: "Reported On",       value: formatDate(result.timestamp) },
                    { icon: ThumbsUp,  label: "Community Support", value: `${result.upvotes} upvotes` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        <Icon className="w-3 h-3" /> {label}
                      </div>
                      <p className="text-slate-800 font-semibold text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{result.description}</p>
                </div>

                {/* Before / After */}
                {(result.beforeImage || result.afterImage) && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution Photos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {result.beforeImage && (
                        <div>
                          <p className="text-xs font-bold text-red-600 mb-1">Before</p>
                          <img src={result.beforeImage} alt="before" className="w-full h-28 object-cover rounded-xl border-2 border-red-200" />
                        </div>
                      )}
                      {result.afterImage && (
                        <div>
                          <p className="text-xs font-bold text-green-600 mb-1">After</p>
                          <img src={result.afterImage} alt="after" className="w-full h-28 object-cover rounded-xl border-2 border-green-200" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button onClick={handleDownload} disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-sm transition-all">
                  <Download className="w-4 h-4" />
                  {downloading ? "Generating PDF…" : "Download Official PDF Report"}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" /> Progress Timeline
              </h3>
              <StatusTimeline status={result.status} />
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-xs text-orange-700 text-center">
              Subject to the Right to Information Act, 2005. Keep your Complaint ID for future reference.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}