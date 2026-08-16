// Export helpers - CSV, real .xlsx (SheetJS) and real .pdf (jsPDF + autotable).

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function esc(v) {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function downloadCSV(filename, headers, rows) {
  const lines = [headers, ...rows].map((r) => r.map(esc).join(','))
  const content = '\ufeff' + lines.join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function safeName(name) {
  return String(name || 'report').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'report'
}

// Real Excel file export (.xlsx)
export function exportXLSX(filename, headers, rows, sheetName) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  sheet['!cols'] = (headers || []).map((h) => ({ wch: Math.max(12, String(h).length + 4) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, (sheetName || 'Report').slice(0, 31))
  XLSX.writeFile(wb, safeName(filename) + '.xlsx')
}

// Multi-sheet Excel export: [{ sheet, headers, rows }]
export function exportXLSXBook(filename, sections) {
  const wb = XLSX.utils.book_new()
  sections.forEach((s) => {
    const sheet = XLSX.utils.aoa_to_sheet([s.headers, ...(s.rows || [])])
    sheet['!cols'] = (s.headers || []).map((h) => ({ wch: Math.max(12, String(h).length + 4) }))
    XLSX.utils.book_append_sheet(wb, sheet, (s.sheet || 'Sheet').slice(0, 31))
  })
  XLSX.writeFile(wb, safeName(filename) + '.xlsx')
}

// Real PDF file export. sections: [{ title, headers?, rows?, text? }]
export function exportPDF(title, sections) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  doc.setFontSize(17)
  doc.setTextColor(12, 44, 18)
  doc.text(String(title), 40, 42)
  doc.setFontSize(9)
  doc.setTextColor(130, 130, 130)
  doc.text(`Amen Events EMS · Generated ${new Date().toLocaleString()}`, 40, 56)
  doc.setDrawColor(34, 139, 34)
  doc.setLineWidth(1.5)
  doc.line(40, 62, 560, 62)

  let y = 78
  sections.forEach((s) => {
    if (y > 770) { doc.addPage(); y = 50 }
    doc.setFontSize(12)
    doc.setTextColor(28, 115, 28)
    doc.text(String(s.title), 40, y)
    y += 8
    if (s.rows && s.rows.length) {
      autoTable(doc, {
        startY: y,
        head: [s.headers || []],
        body: s.rows,
        margin: { left: 40, right: 40 },
        styles: { fontSize: 8, cellPadding: 4, textColor: [18, 44, 18] },
        headStyles: { fillColor: [34, 139, 34], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 248, 240] },
      })
      y = doc.lastAutoTable.finalY + 22
    } else if (s.text != null) {
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      const lines = doc.splitTextToSize(String(s.text), 520)
      doc.text(lines, 40, y)
      y += lines.length * 14 + 8
    }
    if (s.rows && s.rows.length) y += 8
  })
  doc.save(safeName(title) + '.pdf')
  return true
}

function tableHTML(headers, rows) {
  return (
    `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c == null ? '-' : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  )
}

// Print-window fallback (kept for browsers that block downloads / preview use)
export function exportPDFPrint(title, sections) {
  const win = window.open('', '_blank', 'width=960,height=720')
  if (!win) return false
  const body = sections.map((s) =>
    `<section><h2>${esc(s.title)}</h2>${s.rows ? tableHTML(s.headers || [], s.rows) : `<p>${esc(s.text || '')}</p>`}</section>`
  ).join('')
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    body{font-family:'Segoe UI',Arial,sans-serif;color:#122c12;padding:32px;max-width:920px;margin:0 auto}
    h1{font-size:22px;border-bottom:2px solid #228b22;padding-bottom:8px}
    h2{font-size:15px;color:#1c731c;margin-top:26px}
    table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
    th{background:#e1eee1;text-align:left;padding:6px 8px}
    td{border-bottom:1px solid #e1eee1;padding:6px 8px}
    .meta{font-size:12px;color:#777;margin-top:4px}
  </style></head><body><h1>${esc(title)}</h1><p class="meta">Amen Events EMS · Generated ${esc(new Date().toLocaleString())}</p>${body}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { try { win.print() } catch (e) { /* popup blocked after write */ } }, 300)
  return true
}
