import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ───────── CSV EXPORT ───────── */
export function exportCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csv = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ───────── PDF HELPERS ───────── */
const BRAND_GREEN = [16, 185, 129]
const BRAND_SLATE = [71, 85, 105]

function header(doc, title, subtitle) {
  doc.setFillColor(11, 31, 51)
  doc.rect(0, 0, 210, 26, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('MEIL', 14, 11)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('BRSR · ESG · SDG Portal', 14, 17)
  doc.setFontSize(9)
  doc.text('FY 2025-26', 196, 11, { align: 'right' })
  doc.text(new Date().toLocaleDateString('en-IN'), 196, 17, { align: 'right' })

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 40)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(subtitle, 14, 47)
  }
}

function footer(doc) {
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `MEIL ESG Portal · Generated ${new Date().toLocaleString('en-IN')}`,
      14,
      290
    )
    doc.text(`Page ${i} / ${pages}`, 196, 290, { align: 'right' })
  }
}

/* ───────── ESG REPORT PDF ───────── */
export function exportESGPDF({ agg, entities, principleScores, principles }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'ESG Report — FY 2025-26', 'Consolidated BRSR across 10 entities')

  let y = 56

  const scope1 = agg.P6.scope1
  const scope2 = agg.P6.scope2
  const water = agg.P6.waterWithdrawal
  const energy = agg.P6.energyConsumption
  const waste = agg.P6.wasteRecycled

  autoTable(doc, {
    startY: y,
    head: [['Key Metric', 'Value', 'Unit']],
    body: [
      ['Scope 1 GHG', scope1.toLocaleString(), 'tCO2e'],
      ['Scope 2 GHG', scope2.toLocaleString(), 'tCO2e'],
      ['Total Emissions', (scope1 + scope2).toLocaleString(), 'tCO2e'],
      ['Water Withdrawal', water.toFixed(1), 'ML'],
      ['Energy Consumption', energy.toLocaleString(), 'GJ (000)'],
      ['Waste Recycled', waste.toFixed(1), '%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })
  y = doc.lastAutoTable.finalY + 10

  autoTable(doc, {
    startY: y,
    head: [['Principle', 'Name', 'Score /100', 'SDG Mapping']],
    body: principles.map((p, i) => [
      p.id,
      p.name,
      String(principleScores[i]),
      p.sdgs.map((s) => `SDG ${s}`).join(', '),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })
  y = doc.lastAutoTable.finalY + 10

  autoTable(doc, {
    startY: y,
    head: [['Entity', 'Type', 'Scope 1+2 (tCO2e)', 'Water (ML)', 'LTIFR']],
    body: entities.map((e) => [
      e.name,
      e.type.replace('_', ' '),
      (e.scope1 + e.scope2).toLocaleString(),
      String(e.water),
      String(e.ltifr),
    ]),
    theme: 'grid',
    headStyles: { fillColor: BRAND_SLATE, textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  })

  footer(doc)
  doc.save('MEIL_ESG_Report_FY2025-26.pdf')
}

/* ───────── SDG REPORT PDF ───────── */
export function exportSDGPDF({ sdgScores, activeSdgs, avgScore }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(
    doc,
    'SDG Alignment Report — FY 2025-26',
    `${activeSdgs.length} of 17 UN SDGs mapped · Avg alignment ${avgScore}/100`
  )

  let y = 56

  autoTable(doc, {
    startY: y,
    head: [['SDG', 'Goal', 'Score /100', 'Mapped via Principles']],
    body: activeSdgs.map((s) => [
      `SDG ${s.id}`,
      s.name,
      String(sdgScores[s.id]),
      s.principles || '',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 18 },
      2: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  })

  footer(doc)
  doc.save('MEIL_SDG_Report_FY2025-26.pdf')
}
