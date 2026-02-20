// src/pages/Report.jsx — with image upload, fake detection, AI classify, unique ID

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, AlertCircle, CheckCircle, ArrowLeft, Sparkles, Loader2, Brain, Upload, X, ShieldAlert, ShieldCheck } from "lucide-react"
import { departments } from "../data/mockComplaints"
import { classifyComplaint } from "../hooks/useAIClassifier"
import { detectFakeComplaint } from "../hooks/useFakeDetector"

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
      timestamp: new Date().toISOString(),
      images: images.map(i => i.preview),
      submittedBy: user?.email,
      source: "web_form",
    })
    setSubmittedId(complaintId)
    setSubmitted(true)
    setTimeout(() => navigate("/dashboard"), 3500)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaint Submitted!</h2>
          <div className="bg-slate-900 rounded-xl px-5 py-3 mb-4 inline-block">
            <p className="text-xs text-slate-400 mb-1">Your Complaint ID</p>
            <p className="text-xl font-black text-orange-400 font-mono tracking-widest">{submittedId}</p>
          </div>
          <p className="text-slate-500 text-sm">Save this ID to track your complaint.</p>
          <p className="text-xs text-slate-400 mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    )
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