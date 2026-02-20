// src/pages/Dashboard.jsx

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X, PlusCircle } from "lucide-react"
import ComplaintCard from "../components/ComplaintCard"

const filterOptions = [
  { value: "all", label: "All" },
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" }
]

export default function Dashboard({ complaints, setComplaints }) {
  const navigate = useNavigate()
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // FIX: Upvote handler — updates state immutably so React re-renders
  const handleUpvote = (id) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
      )
    )
  }

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesUrgency =
      urgencyFilter === "all" || complaint.urgency === urgencyFilter

    const matchesSearch =
      searchQuery === "" ||
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.location.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesUrgency && matchesSearch
  })

  return (
    <div className="flex-1 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Complaint Feed</h1>
              <p className="text-slate-600 mt-1">
                {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => navigate("/report")}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-orange-500/20"
            >
              <PlusCircle className="w-5 h-5" />
              New Report
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search complaints, keywords, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">Filter by urgency:</span>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setUrgencyFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                urgencyFilter === option.value
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
          {(urgencyFilter !== "all" || searchQuery !== "") && (
            <button
              onClick={() => { setUrgencyFilter("all"); setSearchQuery("") }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No complaints match your filters
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onUpvote={handleUpvote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}