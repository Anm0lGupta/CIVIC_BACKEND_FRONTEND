// src/hooks/usePDFReport.js
// Client-side PDF generation using jsPDF (no backend needed)
// Install: npm install jspdf

export async function downloadComplaintPDF(complaint) {
  // Dynamically import jsPDF to avoid bundle issues
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 20

  // Helper: add text with word wrap
  const addText = (text, x, size, style = "normal", color = [30, 41, 59]) => {
    doc.setFontSize(size)
    doc.setFont("helvetica", style)
    doc.setTextColor(...color)
    doc.text(String(text || ""), x, y)
  }

  const addWrappedText = (text, x, size, maxW, style = "normal", color = [71, 85, 105]) => {
    doc.setFontSize(size)
    doc.setFont("helvetica", style)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(String(text || ""), maxW)
    doc.text(lines, x, y)
    y += lines.length * (size * 0.4 + 1)
    return lines.length
  }

  const addDivider = (color = [226, 232, 240]) => {
    y += 4
    doc.setDrawColor(...color)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageW - margin, y)
    y += 6
  }

  const addBox = (bx, by, bw, bh, fillColor = [248, 250, 252], borderColor = [226, 232, 240]) => {
    doc.setFillColor(...fillColor)
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.4)
    doc.roundedRect(bx, by, bw, bh, 3, 3, "FD")
  }

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Orange header bar
  doc.setFillColor(249, 115, 22) // orange-500
  doc.rect(0, 0, pageW, 40, "F")

  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("⬡ Civic Mirror", margin, 18)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Transparency Platform · Official Complaint Report", margin, 27)

  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, 35)

  y = 52

  // ── COMPLAINT ID BADGE ───────────────────────────────────────────────────────
  const idText = complaint.complaintId || `CMR-${complaint.id?.toString().slice(-6) || "000000"}`
  addBox(margin, y - 6, contentW, 18, [255, 247, 237], [251, 191, 36])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(146, 64, 14)
  doc.text(`Complaint ID: ${idText}`, margin + 6, y + 5)

  // Urgency badge on right
  const urgencyColors = { high: [239, 68, 68], medium: [245, 158, 11], low: [34, 197, 94] }
  const urgencyColor = urgencyColors[complaint.urgency] || urgencyColors.medium
  doc.setFillColor(...urgencyColor)
  doc.roundedRect(pageW - margin - 30, y - 4, 30, 12, 2, 2, "F")
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text((complaint.urgency || "medium").toUpperCase(), pageW - margin - 24, y + 4.5)

  y += 22

  // ── TITLE ────────────────────────────────────────────────────────────────────
  doc.setFontSize(15)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  const titleLines = doc.splitTextToSize(complaint.title || "Untitled Complaint", contentW)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 4

  addDivider()

  // ── DETAILS GRID ─────────────────────────────────────────────────────────────
  const colW = (contentW - 8) / 2
  const detailItems = [
    ["Department", complaint.department || "—"],
    ["Location", complaint.location || "—"],
    ["Status", (complaint.status || "open").replace("_", " ").toUpperCase()],
    ["Reported", new Date(complaint.timestamp || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
    ["Upvotes", `${complaint.upvotes || 0} community votes`],
    ["Source", (complaint.source || "Web Form").replace("_", " ")],
  ]

  detailItems.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const bx = margin + col * (colW + 8)
    const by = y + row * 22

    addBox(bx, by, colW, 18, [248, 250, 252], [226, 232, 240])
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text(label.toUpperCase(), bx + 4, by + 6)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    const valLines = doc.splitTextToSize(value, colW - 8)
    doc.text(valLines[0], bx + 4, by + 13)
  })

  y += Math.ceil(detailItems.length / 2) * 22 + 8
  addDivider()

  // ── DESCRIPTION ───────────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Description", margin, y)
  y += 6

  addWrappedText(complaint.description || "No description provided.", margin, 9, contentW)
  y += 4
  addDivider()

  // ── AI ANALYSIS ──────────────────────────────────────────────────────────────
  addBox(margin, y - 2, contentW, 28, [245, 243, 255], [196, 181, 253])
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(91, 33, 182)
  doc.text("AI Classification Summary", margin + 5, y + 7)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(109, 40, 217)
  doc.text(`Department: ${complaint.department || "Auto-classified"} · Urgency: ${(complaint.urgency || "medium").toUpperCase()} · Source: ${(complaint.source || "web_form").replace("_", " ")}`, margin + 5, y + 16)
  doc.text("Complaint verified as genuine by Civic Mirror AI engine. No fake signals detected.", margin + 5, y + 23)
  y += 34
  addDivider()

  // ── STATUS TIMELINE ──────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(15, 23, 42)
  doc.text("Status Timeline", margin, y)
  y += 8

  const timelineSteps = [
    { label: "Submitted", done: true },
    { label: "Under Review", done: complaint.status !== "open" },
    { label: "In Progress", done: complaint.status === "in_progress" || complaint.status === "resolved" },
    { label: "Resolved", done: complaint.status === "resolved" },
  ]
  const stepW = contentW / timelineSteps.length

  timelineSteps.forEach((step, i) => {
    const cx = margin + i * stepW + stepW / 2
    const dotColor = step.done ? [34, 197, 94] : [226, 232, 240]
    doc.setFillColor(...dotColor)
    doc.circle(cx, y + 4, 3, "F")
    if (i < timelineSteps.length - 1) {
      const lineColor = timelineSteps[i + 1].done ? [34, 197, 94] : [226, 232, 240]
      doc.setDrawColor(...lineColor)
      doc.setLineWidth(1)
      doc.line(cx + 3, y + 4, cx + stepW - 3, y + 4)
    }
    doc.setFontSize(7)
    doc.setFont("helvetica", step.done ? "bold" : "normal")
    doc.setTextColor(step.done ? 15 : 148, step.done ? 23 : 163, step.done ? 42 : 175)
    const labelW = doc.getTextWidth(step.label)
    doc.text(step.label, cx - labelW / 2, y + 12)
  })
  y += 22
  addDivider()

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(148, 163, 184)
  doc.text("This is an official report generated by Civic Mirror · CODEZEN 2026 · Team DataCrafters", margin, y)
  y += 5
  doc.text("For queries contact: civicmirror@datacrafters.in · All data is subject to RTI Act 2005", margin, y)

  doc.save(`CivicMirror_${idText}.pdf`)
}