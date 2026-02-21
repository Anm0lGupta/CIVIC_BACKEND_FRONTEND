// src/pages/CommunityConnect.jsx
// Community Connect — citizen-only community board

import { useState } from "react"
import {
  Send, ThumbsUp, MessageSquare, Share2, CheckCircle, RefreshCw,
  AtSign, MapPin, X, TrendingUp, Users
} from "lucide-react"
import { classifyComplaint } from "../hooks/useAIClassifier"

const MOCK_POSTS = [
  {
    id: "c1", author: "Ramesh Kumar", avatar: "RK", time: "3m ago",
    text: "The drain near Lajpat Nagar market has been overflowing since last night. Sewage water on the road. Kids going to school are walking through it. @MCD please act ASAP.",
    tags: ["@MCD", "@SanitationDept"], location: "Lajpat Nagar", upvotes: 34, comments: 8,
  },
  {
    id: "c2", author: "Arjun Mehta", avatar: "AM", time: "18m ago",
    text: "Pothole on the main road in Rohini Sector 3 has been there for 3 months and still not fixed. Two bikes have fallen there this week alone. Tagging @PWD and @DelhiGovt.",
    tags: ["@PWD", "@DelhiGovt"], location: "Rohini Sector 3", upvotes: 91, comments: 27,
    trending: true, verified: true,
  },
  {
    id: "c3", author: "Priya Sharma", avatar: "PS", time: "1h ago",
    text: "Water supply completely cut in our building since yesterday evening. 50 families affected. No response from Delhi Jal Board helpline. Janakpuri Sector 4.",
    tags: ["@DelhiJalBoard"], location: "Janakpuri Sector 4", upvotes: 78, comments: 19,
  },
  {
    id: "c4", author: "Sunita Verma", avatar: "SV", time: "2h ago",
    text: "Garbage has not been collected from our street in Vasant Kunj for over a week now. Flies and mosquitoes everywhere. Children are falling sick. Please send MCD truck urgently.",
    tags: ["@MCD", "@SanitationDept"], location: "Vasant Kunj", upvotes: 62, comments: 14,
  },
  {
    id: "c5", author: "Deepak Nair", avatar: "DN", time: "3h ago",
    text: "Streetlight outside DPS Dwarka has been non-functional for 12 days. The road is pitch dark at night — extremely unsafe for students and pedestrians. @BSES @MCD please fix ASAP.",
    tags: ["@BSES", "@MCD"], location: "Dwarka Sector 10", upvotes: 110, comments: 33,
    trending: true,
  },
  {
    id: "c6", author: "Kavitha Reddy", avatar: "KR", time: "5h ago",
    text: "The park in our colony, Mayur Vihar Phase 2, has broken benches and a non-functional water fountain. Kids have nowhere safe to play. Filed 2 complaints with DDA, no action.",
    tags: ["@DDA"], location: "Mayur Vihar Phase 2", upvotes: 44, comments: 9,
  },
]

const OFFICIAL_TAGS = [
  "@MCD", "@PWD", "@DelhiJalBoard", "@BSES", "@DelhiPolice",
  "@DDA", "@DelhiGovt", "@AAP", "@NorthMCD", "@SouthMCD",
]

const AVATAR_COLORS = [
  "bg-orange-500","bg-sky-500","bg-violet-500",
  "bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500",
]

function AIBadge({ text }) {
  const ai = classifyComplaint(text, "")
  if (!ai?.isCivic) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      <span className="text-[10px] text-slate-400 font-medium">AI →</span>
      {ai.department && (
        <span className="text-[10px] bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full font-semibold">
          {ai.department}
        </span>
      )}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
        ai.urgency === "high"   ? "bg-red-50 text-red-600 border-red-200" :
        ai.urgency === "medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                  "bg-green-50 text-green-600 border-green-200"
      }`}>
        {ai.urgency === "high" ? "🔴" : ai.urgency === "medium" ? "🟡" : "🟢"} {ai.urgency?.toUpperCase()}
      </span>
      <span className="text-[10px] text-slate-300">{ai.confidence}%</span>
    </div>
  )
}

function PostCard({ post, onUpvote, votedIds }) {
  const [showComments, setShowComments]   = useState(false)
  const [comment, setComment]             = useState("")
  const [localComments, setLocalComments] = useState([])
  const hasVoted  = votedIds.has(post.id)
  const colorIdx  = post.avatar.charCodeAt(0) % AVATAR_COLORS.length

  const submitComment = () => {
    if (!comment.trim()) return
    setLocalComments(p => [...p, { text: comment, author: "You", time: "Just now" }])
    setComment("")
  }

  return (
    <div className={`bg-white rounded-xl border transition-shadow overflow-hidden ${
      post.trending ? "border-orange-200 shadow-sm shadow-orange-100" : "border-slate-200"
    }`}>
      {post.trending && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-white" />
          <span className="text-[10px] font-bold text-white tracking-wide">TRENDING</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${AVATAR_COLORS[colorIdx]}`}>
              {post.avatar}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-slate-900">{post.author}</p>
                {post.verified && <CheckCircle className="w-3 h-3 text-sky-500 fill-sky-100" />}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-2.5 h-2.5 text-orange-400" />
                <span className="text-[10px] font-semibold text-orange-500">Community</span>
                <span className="text-[10px] text-slate-400">· {post.time}</span>
              </div>
            </div>
          </div>
          {post.location && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
              <MapPin className="w-2.5 h-2.5" />{post.location}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-700 leading-relaxed mb-2.5">{post.text}</p>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.map(tag => (
              <span key={tag} className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full font-semibold">
                {tag}
              </span>
            ))}
          </div>
        )}

        <AIBadge text={post.text} />

        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100">
          <button onClick={() => onUpvote(post.id)} disabled={hasVoted}
            className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
              hasVoted ? "text-orange-500 cursor-default" : "text-slate-400 hover:text-orange-500"
            }`}>
            <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? "fill-orange-400" : ""}`} />
            {post.upvotes + (hasVoted ? 1 : 0)}
          </button>
          <button onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-sky-500 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            {post.comments + localComments.length}
          </button>
          <button className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-green-500 transition-colors ml-auto">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>

        {showComments && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
            {localComments.map((c, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">Y</div>
                <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 flex-1">
                  <span className="text-[10px] font-bold text-slate-700">{c.author} · </span>
                  <span className="text-[10px] text-slate-400">{c.time}</span>
                  <p className="text-xs text-slate-700 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 items-center">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">Y</div>
              <input value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder="Add a comment..."
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <button onClick={submitComment} className="text-orange-500 hover:text-orange-600">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PostComposer({ onPost, user }) {
  const [text, setText]         = useState("")
  const [location, setLocation] = useState("")
  const [tags, setTags]         = useState([])
  const [tagInput, setTagInput] = useState("")
  const [showTagSuggest, setShowTagSuggest] = useState(false)
  const [posting, setPosting]   = useState(false)
  const [posted, setPosted]     = useState(false)

  const tagSuggestions = OFFICIAL_TAGS.filter(t =>
    t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t)
  )
  const addTag    = (tag) => { if (!tags.includes(tag)) setTags(p => [...p, tag]); setTagInput(""); setShowTagSuggest(false) }
  const removeTag = (tag) => setTags(p => p.filter(t => t !== tag))

  const handlePost = () => {
    if (!text.trim() || text.length < 20) return
    setPosting(true)
    setTimeout(() => {
      onPost({
        id: `user-${Date.now()}`,
        author: user?.name || "Anonymous Citizen",
        avatar: (user?.name || "AC").slice(0, 2).toUpperCase(),
        time: "Just now", text: text.trim(), tags,
        location: location.trim() || "Delhi",
        upvotes: 0, comments: 0, verified: false,
      })
      setText(""); setLocation(""); setTags([])
      setPosting(false); setPosted(true)
      setTimeout(() => setPosted(false), 2500)
    }, 700)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
          {(user?.name || "?").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">{user?.name || "Citizen"}</p>
          <p className="text-[10px] text-slate-400">Post a civic issue to the community</p>
        </div>
      </div>

      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder="Describe the civic issue you're facing... AI will auto-classify your complaint."
        rows={3}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />

      {text.length > 20 && <AIBadge text={text} />}

      <div className="flex gap-2 mt-2.5">
        <div className="relative flex-1">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location"
            className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="relative flex-1">
          <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input value={tagInput}
            onChange={e => { setTagInput(e.target.value); setShowTagSuggest(true) }}
            onFocus={() => setShowTagSuggest(true)}
            placeholder="Tag official (@MCD...)"
            className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500" />
          {showTagSuggest && tagInput && tagSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {tagSuggestions.slice(0, 4).map(tag => (
                <button key={tag} onClick={() => addTag(tag)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 text-orange-600 font-semibold transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-0.5 text-[10px] bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full font-semibold">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-0.5"><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-slate-400">{text.length}/500 · Min 20 chars</p>
        <button onClick={handlePost} disabled={posting || text.length < 20}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
            posted   ? "bg-green-500 text-white" :
            posting || text.length < 20 ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
            "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/30"
          }`}>
          {posted  ? <><CheckCircle className="w-3.5 h-3.5" /> Posted!</> :
           posting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Posting...</> :
                     <><Send className="w-3.5 h-3.5" /> Post</>}
        </button>
      </div>
    </div>
  )
}

export default function CommunityConnect({ user, addComplaint }) {
  const [posts, setPosts]       = useState(MOCK_POSTS)
  const [votedIds, setVotedIds] = useState(new Set())
  const [sortBy, setSortBy]     = useState("recent")

  const handleUpvote = (id) => {
    if (votedIds.has(id)) return
    setVotedIds(prev => new Set([...prev, id]))
  }

  const handleNewPost = (post) => {
    setPosts(prev => [post, ...prev])
    const ai = classifyComplaint(post.text, "")
    if (ai?.isCivic) {
      const spots = [[28.6315,77.2167],[28.5677,77.2433],[28.7298,77.1116],[28.6517,77.1906]]
      const spot  = spots[Math.floor(Math.random() * spots.length)]
      addComplaint?.({
        id: Date.now() + Math.random(),
        complaintId: `CMR-2026-${2000 + Math.floor(Math.random() * 999)}`,
        title: post.text.slice(0, 60).trim() + "...",
        description: post.text,
        location: post.location || "Delhi",
        urgency: ai.urgency || "medium",
        department: ai.department || "Infrastructure",
        status: "open", upvotes: 0,
        timestamp: new Date().toISOString(),
        source: "community", sourceHandle: post.author,
        lat: spot[0] + (Math.random() - 0.5) * 0.02,
        lng: spot[1] + (Math.random() - 0.5) * 0.02,
      })
    }
  }

  const sortedPosts = [...posts].sort((a, b) =>
    sortBy === "top" ? b.upvotes - a.upvotes : 0
  )

  const trendingCount = posts.filter(p => p.trending).length
  const totalUpvotes  = posts.reduce((s, p) => s + p.upvotes, 0)

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Community Connect
              <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold tracking-wide">NEW</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Citizens post civic issues · AI auto-classifies · Authorities notified</p>
          </div>
          <div className="hidden sm:flex items-center divide-x divide-slate-200">
            {[
              { value: posts.length,  label: "Posts",    color: "text-orange-500" },
              { value: trendingCount, label: "Trending", color: "text-green-500"  },
              { value: totalUpvotes,  label: "Votes",    color: "text-blue-500"   },
            ].map(s => (
              <div key={s.label} className="px-5 text-center">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <div className="lg:col-span-2 space-y-3">
            <PostComposer onPost={handleNewPost} user={user} />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sort:</span>
              {[{ key: "recent", label: "Most Recent" }, { key: "top", label: "Top Voted" }].map(opt => (
                <button key={opt.key} onClick={() => setSortBy(opt.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    sortBy === opt.key ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-slate-400">{posts.length} posts</span>
            </div>

            {sortedPosts.map(post => (
              <PostCard key={post.id} post={post} onUpvote={handleUpvote} votedIds={votedIds} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-800 text-sm mb-3">How it works</h3>
              <div className="space-y-2.5">
                {[
                  { icon: "✍️", title: "Post Your Issue",    desc: "Describe the civic problem with location & tags" },
                  { icon: "🤖", title: "AI Classifies It",   desc: "Department & urgency detected automatically"    },
                  { icon: "📧", title: "Authority Notified", desc: "Right MCD zone or dept gets emailed"            },
                  { icon: "👍", title: "Community Votes",    desc: "High-upvote posts get priority attention"       },
                ].map(item => (
                  <div key={item.title} className="flex gap-2.5 items-start">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-800 text-sm mb-1">Tag Officials</h3>
              <p className="text-[10px] text-slate-400 mb-2.5">Tagged authorities get notified automatically.</p>
              <div className="flex flex-wrap gap-1.5">
                {OFFICIAL_TAGS.map(tag => (
                  <span key={tag} className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-semibold cursor-pointer hover:bg-orange-100 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-black text-slate-800 text-sm mb-3">Community Stats</h3>
              <div className="space-y-2">
                {[
                  { label: "Total Posts",    value: posts.length    },
                  { label: "Trending Now",   value: trendingCount   },
                  { label: "Total Votes",    value: totalUpvotes    },
                  { label: "Resolved Today", value: 3               },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{s.label}</span>
                    <span className="text-xs font-black text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
