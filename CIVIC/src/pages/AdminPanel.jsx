// src/pages/AdminPanel.jsx — with before/after image upload

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Shield, LogOut, CheckCircle, Clock, AlertCircle, ChevronDown, Image } from "lucide-react"

const ADMIN_PASSWORD = "civic2026"

const statusConfig = {
  open: { bg: "bg-blue-100", text: "text-blue-700", label: "Open", icon: AlertCircle },
  in_progress: { bg: "bg-purple-100", text: "text-purple-700", label: "In Progress", icon: Clock },
  resolved: { bg: "bg-green-100", text: "text-green-700", label: "Resolved", icon: CheckCircle },
}
const urgencyColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
}

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === ADMIN_PASSWORD) { onUnlock() }
    else { setError(true); setTimeout(() => setError(false), 1500) }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-xl font-black text-white mb-1">Admin Access</h1>
          <p className="text-slate-400 text-sm mb-6">Enter the admin password to continue</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="password" placeholder="Password" value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              className={`w-full px-4 py-2.5 rounded-lg bg-slate-700 text-white placeholder-slate-400 border focus:outline-none focus:ring-2 focus:ring-orange-500 ${error ? "border-red-500 animate-pulse" : "border-slate-600"}`}
              autoFocus />
            {error && <p className="text-red-400 text-xs">Incorrect password. Try again.</p>}
            <button type="submit" className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors">
              Unlock Admin Panel
            </button>
          </form>
          <p className="text-slate-600 text-xs mt-4">Demo password: civic2026</p>
        </div>
      </div>
    </div>
  )
}

function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false)
  const cfg = statusConfig[current] || statusConfig.open
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
        <cfg.icon className="w-3.5 h-3.5" />{cfg.label}<ChevronDown className="w-3 h-3 ml-1" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-xl w-40">
          {Object.entries(statusConfig).map(([s, c]) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-50 ${s === current ? c.text : "text-slate-700"}`}>
              <c.icon className="w-3.5 h-3.5" />{c.label}
              {s === current && <span className="ml-auto text-slate-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BeforeAfterCell({ complaint, onUpdate }) {
  const beforeRef = useRef(null)
  const afterRef = useRef(null)

  const handleUpload = (type, e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpdate(complaint.id, type, ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <button onClick={() => beforeRef.current?.click()}
          className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${complaint.beforeImage ? "bg-red-100 border border-red-300 text-red-700" : "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"}`}>
          {complaint.beforeImage ? "✓ Before" : "+ Before"}
        </button>
        <button onClick={() => afterRef.current?.click()}
          className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${complaint.afterImage ? "bg-green-100 border border-green-300 text-green-700" : "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-green-50 hover:text-green-600"}`}>
          {complaint.afterImage ? "✓ After" : "+ After"}
        </button>
      </div>
      {(complaint.beforeImage || complaint.afterImage) && (
        <div className="flex gap-1">
          {complaint.beforeImage && <img src={complaint.beforeImage} alt="before" className="w-10 h-10 object-cover rounded border-2 border-red-200" />}
          {complaint.afterImage && <img src={complaint.afterImage} alt="after" className="w-10 h-10 object-cover rounded border-2 border-green-200" />}
        </div>
      )}
      <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload("beforeImage", e)} />
      <input ref={afterRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload("afterImage", e)} />
    </div>
  )
}

function AdminDashboard({ complaints, setComplaints, onLogout }) {
  const [filterDept, setFilterDept] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState(null)

  const depts = ["all", ...new Set(complaints.map(c => c.department).filter(Boolean))]

  const filtered = complaints.filter(c => {
    return (filterDept === "all" || c.department === filterDept) &&
      (filterStatus === "all" || c.status === filterStatus) &&
      (!search || c.title.toLowerCase().includes(search.toLowerCase()))
  })

  const updateStatus = (id, newStatus) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    const c = complaints.find(c => c.id === id)
    setToast(`"${c?.title?.slice(0, 28)}..." → ${statusConfig[newStatus]?.label}`)
    setTimeout(() => setToast(null), 3000)
  }

  const updateImage = (id, field, value) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const total = complaints.length
  const open = complaints.filter(c => c.status === "open").length
  const inProg = complaints.filter(c => c.status === "in_progress").length
  const resolved = complaints.filter(c => c.status === "resolved").length
  const neglected = complaints.filter(c => {
    if (c.status === "resolved" || c.timestamp === "Just now") return false
    return Math.floor((new Date() - new Date(c.timestamp)) / 86400000) >= 30
  }).length

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-none">Admin Panel</h1>
            <p className="text-slate-400 text-xs">Civic Mirror · Complaint Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">🔴 LIVE — changes apply immediately</span>
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: total, color: "text-slate-700", bg: "bg-white" },
            { label: "Open", value: open, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "In Progress", value: inProg, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Resolved", value: resolved, color: "text-green-600", bg: "bg-green-50" },
            { label: "⚠️ Neglected", value: neglected, color: "text-red-600", bg: "bg-red-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-4 text-center`}>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-48" />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            {depts.map(d => <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <span className="text-sm text-slate-400 ml-auto">{filtered.length} shown</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dept / Urgency</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Upvotes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Before / After</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                const neglectedRow = c.status !== "resolved" && c.timestamp !== "Just now" &&
                  Math.floor((new Date() - new Date(c.timestamp)) / 86400000) >= 30
                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${neglectedRow ? "bg-red-50/40" : ""}`}>
                    <td className="px-4 py-3 max-w-xs">
                      {c.complaintId && <span className="text-xs font-mono text-orange-500 font-bold">{c.complaintId}</span>}
                      <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                      <p className="text-xs text-slate-400 truncate">{c.location}</p>
                      {neglectedRow && <span className="text-xs text-red-600 font-bold">⚠️ Neglected 30+ days</span>}
                      {c.source && c.source !== "web_form" && <span className="text-xs text-sky-600 font-semibold">📡 {c.source}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded mb-1 inline-block">{c.department || "—"}</p>
                      <br />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${urgencyColors[c.urgency] || ""}`}>
                        {c.urgency?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">👍 {c.upvotes}</td>
                    <td className="px-4 py-3">
                      <BeforeAfterCell complaint={c} onUpdate={updateImage} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDropdown current={c.status} onChange={s => updateStatus(c.id, s)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-slate-400">No complaints match filters</div>}
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel({ complaints, setComplaints }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("adminUnlocked") === "true")
  const navigate = useNavigate()

  const handleUnlock = () => { sessionStorage.setItem("adminUnlocked", "true"); setUnlocked(true) }
  const handleLogout = () => { sessionStorage.removeItem("adminUnlocked"); setUnlocked(false); navigate("/dashboard") }

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />
  return <AdminDashboard complaints={complaints} setComplaints={setComplaints} onLogout={handleLogout} />
}