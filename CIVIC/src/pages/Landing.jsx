// src/pages/Landing.jsx

import { useNavigate } from "react-router-dom"
import { ArrowRight, MapPin, BarChart3, Bell, Shield, Users, CheckCircle } from "lucide-react"

const stats = [
  { value: "2,400+", label: "Issues Reported" },
  { value: "68%", label: "Resolution Rate" },
  { value: "12", label: "Departments Tracked" },
  { value: "4.2d", label: "Avg Response Time" },
]

const features = [
  { icon: MapPin, title: "Live Complaint Map", desc: "See every civic issue plotted on an interactive map, color-coded by urgency.", color: "bg-orange-100 text-orange-600" },
  { icon: BarChart3, title: "Department Scorecards", desc: "Hold departments accountable with real-time performance scores and trend charts.", color: "bg-blue-100 text-blue-600" },
  { icon: Bell, title: "Upvote & Prioritize", desc: "Community upvoting surfaces the most urgent issues so nothing gets ignored.", color: "bg-purple-100 text-purple-600" },
  { icon: Shield, title: "Transparent Tracking", desc: "Every complaint is tracked from Open → In Progress → Resolved in public view.", color: "bg-green-100 text-green-600" },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-2xl">⬡</span>
          <span className="text-xl font-bold">Civic Mirror</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
          Built for Civic Transparency
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Your city's problems,{" "}
          <span className="text-orange-500">finally visible.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Civic Mirror lets citizens report local issues, track resolution, and hold government departments accountable — all in one transparent platform.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate("/signup")}
            className="flex items-center gap-2 px-7 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-xl shadow-orange-500/25 hover:scale-105"
          >
            Launch Demo <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-7 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-orange-500">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need to track civic issues</h2>
        <p className="text-slate-400 text-center mb-12">From reporting to resolution — all in one place.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-8 pb-24 text-center">
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-black mb-4">Ready to make your city better?</h2>
          <p className="text-slate-400 mb-8">Join thousands of citizens already holding their city accountable.</p>
          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl transition-all hover:scale-105 shadow-xl shadow-orange-500/25"
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-6 text-center text-slate-500 text-sm">
        Built for Hackathon Demo · Civic Mirror · Built with React + Vite
      </footer>
    </div>
  )
}