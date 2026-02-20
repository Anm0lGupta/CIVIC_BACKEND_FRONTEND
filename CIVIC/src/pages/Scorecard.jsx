// src/pages/Scorecard.jsx

import { useState } from "react"
import { mockComplaints, departments } from "../data/mockComplaints"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts"
import { TrendingUp, TrendingDown, Minus, CheckCircle, Clock, AlertCircle } from "lucide-react"

// --- Compute department stats from mockComplaints ---
function getDeptStats() {
  return departments.map((dept) => {
    const deptComplaints = mockComplaints.filter((c) => c.department === dept.name)
    const total = deptComplaints.length
    const resolved = deptComplaints.filter((c) => c.status === "resolved").length
    const inProgress = deptComplaints.filter((c) => c.status === "in_progress").length
    const open = deptComplaints.filter((c) => c.status === "open").length
    const highUrgency = deptComplaints.filter((c) => c.urgency === "high").length
    const totalUpvotes = deptComplaints.reduce((sum, c) => sum + c.upvotes, 0)

    // Score: weighted formula
    const resolutionRate = total > 0 ? resolved / total : 0
    const urgencyPenalty = total > 0 ? (highUrgency / total) * 20 : 0
    const score = Math.min(100, Math.round(resolutionRate * 80 + (inProgress / (total || 1)) * 20 - urgencyPenalty + 10))

    // Fake avg response time (days) — lower is better
    const avgResponseTime = parseFloat((Math.random() * 4 + 1).toFixed(1))

    return {
      ...dept,
      total,
      resolved,
      inProgress,
      open,
      highUrgency,
      totalUpvotes,
      score: Math.max(10, score),
      avgResponseTime,
    }
  })
}

// Fake 6-month trend data
const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]
const trendData = months.map((month, i) => ({
  month,
  Infrastructure: 8 + Math.round(Math.sin(i) * 3),
  Sanitation: 5 + Math.round(Math.cos(i * 0.8) * 2),
  Roads: 4 + Math.round(Math.sin(i * 1.2) * 2),
  Parks: 6 + Math.round(Math.cos(i) * 3),
  Water: 3 + Math.round(Math.sin(i * 0.5) * 1),
}))

const DEPT_COLORS = {
  Infrastructure: "#3b82f6",
  Sanitation: "#10b981",
  Roads: "#f59e0b",
  Parks: "#8b5cf6",
  Water: "#06b6d4",
  Transit: "#ec4899",
  Parking: "#84cc16",
}

function ScoreRing({ score }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="28" cy="28" r="24"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${(score / 100) * 150.8} 150.8`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill || p.stroke }}>
            {p.name}: <span className="font-bold">{p.value}{p.unit || ""}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Scorecard() {
  const [activeTab, setActiveTab] = useState("overview")
  const deptStats = getDeptStats()

  const totalComplaints = mockComplaints.length
  const totalResolved = mockComplaints.filter((c) => c.status === "resolved").length
  const totalInProgress = mockComplaints.filter((c) => c.status === "in_progress").length
  const overallScore = Math.round(deptStats.reduce((s, d) => s + d.score, 0) / deptStats.length)

  const responseTimeData = deptStats.map((d) => ({
    name: d.name,
    days: d.avgResponseTime,
    fill: DEPT_COLORS[d.name] || "#94a3b8",
  }))

  const scoreData = deptStats.map((d) => ({
    name: d.name,
    score: d.score,
    fill: DEPT_COLORS[d.name] || "#94a3b8",
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">Department Scorecards</h1>
          <p className="text-slate-500 mt-1">Performance overview based on complaint resolution</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Complaints", value: totalComplaints, icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Resolved", value: totalResolved, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
            { label: "In Progress", value: totalInProgress, icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "Overall Score", value: `${overallScore}/100`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {["overview", "response time", "trends"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Department Score Cards */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {deptStats.map((dept) => (
                <div key={dept.name} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{dept.name}</h3>
                      <p className="text-xs text-slate-400">{dept.total} complaints</p>
                    </div>
                    <ScoreRing score={dept.score} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Resolved</span>
                      <span className="font-semibold text-green-600">{dept.resolved}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${dept.total ? (dept.resolved / dept.total) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span> In Progress: {dept.inProgress}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Open: {dept.open}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Score Bar Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Department Scores</h2>
              <p className="text-sm text-slate-500 mb-5">Score out of 100 based on resolution rate and urgency</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {scoreData.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Response Time Tab */}
        {activeTab === "response time" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Avg Response Time by Department</h2>
            <p className="text-sm text-slate-500 mb-5">Average days to first action (lower is better)</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTimeData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis unit="d" tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                  {responseTimeData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Rankings */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Rankings (fastest → slowest)</h3>
              {[...responseTimeData]
                .sort((a, b) => a.days - b.days)
                .map((dept, i) => (
                  <div key={dept.name} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 ${i === 0 ? "text-green-500" : i === responseTimeData.length - 1 ? "text-red-500" : "text-slate-400"}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700 w-28">{dept.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${(dept.days / 5) * 100}%`, backgroundColor: dept.fill }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-600 w-12 text-right">{dept.days}d</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Complaint Volume Trends</h2>
            <p className="text-sm text-slate-500 mb-5">New complaints per department over last 6 months</p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {Object.keys(DEPT_COLORS).slice(0, 5).map((dept) => (
                  <Line
                    key={dept}
                    type="monotone"
                    dataKey={dept}
                    stroke={DEPT_COLORS[dept]}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: DEPT_COLORS[dept] }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}