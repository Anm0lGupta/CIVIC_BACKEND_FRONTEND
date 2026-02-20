// src/pages/MapView.jsx

import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const createIcon = (color, neglected = false) =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative">
      ${neglected ? `<div style="position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px;border-radius:50%;background:rgba(239,68,68,0.2);animation:pulse 1.5s infinite;"></div>` : ""}
      <div style="width:22px;height:22px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);${neglected ? "outline:2px solid #ef4444;outline-offset:2px;" : ""}"></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -26],
  })

const icons = {
  high: createIcon("#ef4444"),
  medium: createIcon("#f97316"),
  low: createIcon("#22c55e"),
}
const iconsNeglected = {
  high: createIcon("#ef4444", true),
  medium: createIcon("#f97316", true),
  low: createIcon("#22c55e", true),
}

const DEFAULT_CENTER = [28.6280, 77.1950]
const DEFAULT_ZOOM = 11

function isNeglected(c) {
  if (c.status === "resolved" || c.timestamp === "Just now") return false
  return Math.floor((new Date() - new Date(c.timestamp)) / 86400000) >= 30
}

function HeatMapLayer({ points }) {
  const map = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    if (!map || !points.length) return
    const addHeat = () => {
      if (heatRef.current) map.removeLayer(heatRef.current)
      heatRef.current = window.L.heatLayer(points, {
        radius: 40, blur: 30, maxZoom: 14,
        gradient: {
          0.0: "rgba(255,255,255,0)",
          0.2: "#fed7aa",
          0.4: "#fb923c",
          0.6: "#f97316",
          0.8: "#dc2626",
          1.0: "#7f1d1d",
        },
      }).addTo(map)
    }
    if (!window.L.heatLayer) {
      const s = document.createElement("script")
      s.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
      s.onload = addHeat
      document.head.appendChild(s)
    } else { addHeat() }
    return () => { if (heatRef.current) map.removeLayer(heatRef.current) }
  }, [map, points])

  return null
}

export default function MapView({ complaints }) {
  const [filter, setFilter] = useState("all")
  const [viewMode, setViewMode] = useState("both")

  const filtered = (complaints || []).filter(c => c.lat && c.lng && (filter === "all" || c.urgency === filter))
  const heatPoints = filtered.map(c => [c.lat, c.lng, c.urgency === "high" ? 1.0 : c.urgency === "medium" ? 0.6 : 0.3])
  const neglectedCount = filtered.filter(isNeglected).length
  const showMarkers = viewMode === "markers" || viewMode === "both"
  const showHeat = viewMode === "heatmap" || viewMode === "both"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }} className="bg-white border-b border-slate-200 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900">Complaint Heat Map</h1>
            <p className="text-xs text-slate-400">{filtered.length} complaints plotted{neglectedCount > 0 && <span className="ml-2 text-red-500 font-semibold"> · ⚠️ {neglectedCount} neglected</span>}</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[{ value: "markers", label: "📍 Pins" }, { value: "heatmap", label: "🔥 Heat" }, { value: "both", label: "⚡ Both" }].map(m => (
              <button key={m.value} onClick={() => setViewMode(m.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === m.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {["all", "high", "medium", "low"].map(v => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${filter === v ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {v === "all" ? "All" : v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>High</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span>Medium</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>Low</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {showHeat && <HeatMapLayer points={heatPoints} />}
          {showMarkers && filtered.map(c => {
            const neglected = isNeglected(c)
            const iconSet = neglected ? iconsNeglected : icons
            return (
              <Marker key={c.id} position={[c.lat, c.lng]} icon={iconSet[c.urgency] || icons.medium}>
                <Popup minWidth={220}>
                  <div style={{ padding: "4px 2px" }}>
                    {neglected && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "5px 8px", marginBottom: "8px", fontSize: "11px", color: "#dc2626", fontWeight: "700" }}>⚠️ Neglected 30+ days</div>}
                    {c.complaintId && <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#f97316", fontWeight: "700", marginBottom: "4px" }}>{c.complaintId}</div>}
                    <strong style={{ fontSize: "13px", color: "#0f172a", display: "block", marginBottom: "5px" }}>{c.title}</strong>
                    <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "7px" }}>{c.description?.slice(0, 80)}...</p>
                    <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span>📍 {c.location}</span>
                      {c.department && <span>🏛️ {c.department}</span>}
                      <span>👍 {c.upvotes} upvotes</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
        {showHeat && (
          <div style={{ position: "absolute", bottom: "24px", right: "12px", zIndex: 1000, background: "white", borderRadius: "12px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Complaint Intensity</p>
            <div style={{ width: "130px", height: "10px", borderRadius: "5px", background: "linear-gradient(to right, #fed7aa, #fb923c, #f97316, #dc2626, #7f1d1d)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#94a3b8", marginTop: "3px" }}>
              <span>Low</span><span>Medium</span><span>High</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}