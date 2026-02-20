// src/components/ComplaintCard.jsx — with PDF download + before/after admin images

import { MapPin, Clock, ThumbsUp, Building2, X, AlertTriangle, Download, Image } from 'lucide-react';
import { useState } from 'react';
import { downloadComplaintPDF } from '../hooks/usePDFReport';

const urgencyConfig = {
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: 'HIGH' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'MEDIUM' },
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: 'LOW' }
};
const statusConfig = {
  open: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Open' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' }
};

function formatTimeAgo(timestamp) {
  if (timestamp === 'Just now') return 'Just now';
  const date = new Date(timestamp);
  const diffMs = new Date() - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (isNaN(diffDays)) return timestamp;
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function isNeglected(c) {
  if (c.status === 'resolved' || c.timestamp === 'Just now') return false;
  return Math.floor((new Date() - new Date(c.timestamp)) / 86400000) >= 30;
}

function getVotedIds() { try { return JSON.parse(localStorage.getItem('votedComplaints') || '[]') } catch { return [] } }
function addVotedId(id) { localStorage.setItem('votedComplaints', JSON.stringify([...getVotedIds(), id])) }

// ── Modal ─────────────────────────────────────────────────────────────────────
function ComplaintModal({ complaint, onClose, onUpvote, hasVoted }) {
  const urgency = urgencyConfig[complaint.urgency] || urgencyConfig.medium;
  const status = statusConfig[complaint.status?.toLowerCase().replace(' ', '_')] || statusConfig.open;
  const neglected = isNeglected(complaint);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try { await downloadComplaintPDF(complaint) } catch (e) { console.error(e) }
    setDownloading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {neglected && (
          <div className="bg-red-600 text-white px-5 py-2.5 flex items-center gap-2 rounded-t-2xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-bold">⚠️ Repeated Negligence — No action taken for 30+ days</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-100">
          <div className="flex-1">
            {complaint.complaintId && (
              <span className="inline-block text-xs font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded mb-2">
                {complaint.complaintId}
              </span>
            )}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${urgency.bg} ${urgency.text} border ${urgency.border}`}>{urgency.label}</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
              {complaint.source && complaint.source !== 'web_form' && (
                <span className="px-2 py-0.5 text-xs bg-sky-50 border border-sky-200 text-sky-700 rounded-full font-semibold capitalize">
                  📡 via {complaint.source}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{complaint.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-slate-700 leading-relaxed">{complaint.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {complaint.department && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" />Department</p>
                <p className="text-slate-800 font-medium text-sm">{complaint.department}</p>
              </div>
            )}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</p>
              <p className="text-slate-800 font-medium text-sm">{complaint.location}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Reported</p>
              <p className="text-slate-800 font-medium text-sm">{formatTimeAgo(complaint.timestamp)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1"><ThumbsUp className="w-3 h-3" />Support</p>
              <p className="text-slate-800 font-medium text-sm">{complaint.upvotes} upvotes</p>
            </div>
          </div>

          {/* Complaint photos (before) */}
          {complaint.images?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Image className="w-3.5 h-3.5" />Complaint Photos</h3>
              <div className="flex gap-2 flex-wrap">
                {complaint.images.map((src, i) => (
                  <img key={i} src={src} alt="complaint" className="w-24 h-24 object-cover rounded-xl border-2 border-slate-200" />
                ))}
              </div>
            </div>
          )}

          {/* Admin before/after images */}
          {(complaint.beforeImage || complaint.afterImage) && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin: Before / After</h3>
              <div className="grid grid-cols-2 gap-3">
                {complaint.beforeImage && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">Before</p>
                    <img src={complaint.beforeImage} alt="before" className="w-full h-28 object-cover rounded-xl border-2 border-red-200" />
                  </div>
                )}
                {complaint.afterImage && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-1">After (Resolved)</p>
                    <img src={complaint.afterImage} alt="after" className="w-full h-28 object-cover rounded-xl border-2 border-green-200" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          <button onClick={() => { if (!hasVoted) onUpvote(complaint.id) }} disabled={hasVoted}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
              hasVoted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 active:scale-95'
            }`}>
            <ThumbsUp className="w-5 h-5" />
            {hasVoted ? 'Already voted' : `Upvote · ${complaint.upvotes}`}
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all text-sm">
            <Download className="w-4 h-4" />
            {downloading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export default function ComplaintCard({ complaint, onUpvote }) {
  const [showModal, setShowModal] = useState(false);
  const [votedIds, setVotedIds] = useState(getVotedIds);
  const urgency = urgencyConfig[complaint.urgency] || urgencyConfig.medium;
  const status = statusConfig[complaint.status?.toLowerCase().replace(' ', '_')] || statusConfig.open;
  const hasVoted = votedIds.includes(complaint.id);
  const neglected = isNeglected(complaint);

  const handleUpvote = (id) => {
    if (hasVoted) return;
    addVotedId(id); setVotedIds(getVotedIds()); onUpvote?.(id);
  };

  return (
    <>
      <div onClick={() => setShowModal(true)}
        className={`bg-white rounded-xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5 relative overflow-hidden ${
          neglected ? 'border-2 border-red-400 shadow-red-100 shadow-md' : 'border border-slate-200'
        }`}>
        {neglected && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />}

        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            {complaint.complaintId && (
              <span className="text-xs font-mono text-orange-500 font-bold">{complaint.complaintId} · </span>
            )}
            <h3 className="text-base font-bold text-slate-900 leading-tight">{complaint.title}</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase flex-shrink-0 ${urgency.bg} ${urgency.text} border ${urgency.border}`}>
            {urgency.label}
          </span>
        </div>

        {neglected && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 border border-red-300 rounded-full">
              <AlertTriangle className="w-3 h-3 text-red-600" />
              <span className="text-xs font-bold text-red-600">Repeated Negligence</span>
            </div>
          </div>
        )}

        {complaint.source && complaint.source !== 'web_form' && (
          <span className="text-xs text-sky-600 font-semibold">📡 {complaint.source} · </span>
        )}

        <p className="text-slate-500 text-sm leading-relaxed mb-3 line-clamp-2">{complaint.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
          {complaint.department && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{complaint.department}</span>}
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{complaint.location}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTimeAgo(complaint.timestamp)}</span>
          {complaint.images?.length > 0 && <span className="flex items-center gap-1 text-orange-500"><Image className="w-3.5 h-3.5" />{complaint.images.length} photo{complaint.images.length > 1 ? 's' : ''}</span>}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${status.bg} ${status.text}`}>{status.label}</span>
          <button onClick={e => { e.stopPropagation(); handleUpvote(complaint.id) }} disabled={hasVoted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-semibold ${
              hasVoted ? 'bg-orange-100 text-orange-500 cursor-not-allowed' : 'bg-slate-100 hover:bg-orange-100 hover:text-orange-600 text-slate-700 active:scale-95'
            }`}>
            <ThumbsUp className="w-4 h-4" />{complaint.upvotes}
          </button>
        </div>
      </div>

      {showModal && <ComplaintModal complaint={complaint} onClose={() => setShowModal(false)} onUpvote={handleUpvote} hasVoted={hasVoted} />}
    </>
  )
}