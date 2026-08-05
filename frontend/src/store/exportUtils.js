// Lightweight Excel (CSV) and PDF (print-ready) export helpers — no extra dependencies.
// CSV files open directly in Excel/LibreOffice; PDF reports open a print dialog
// where the user can "Save as PDF".

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

function tableHTML(headers, rows) {
  return (
    `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c == null ? '—' : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  )
}

export function exportPDF(title, sections) {
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
