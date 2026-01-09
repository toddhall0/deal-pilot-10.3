import { ContractAnalysisResult, ChecklistItem } from "@/types/analysis"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string | undefined): string {
  if (!date) return "Not specified"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function renderChecklistTable(items: ChecklistItem[], title: string): string {
  if (!items || items.length === 0) return ""

  const rows = items
    .map(
      (item) => `
      <tr class="${item.isCritical ? "critical" : ""}">
        <td>${escapeHtml(item.item)}</td>
        <td class="center">${item.responsible}</td>
        <td class="center">${item.deadline ? formatDate(item.deadline) : item.deadlineDays ? `${item.deadlineDays} days from ${item.deadlineFromEvent || "effective date"}` : "N/A"}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${item.contractReference ? escapeHtml(item.contractReference) : ""}</td>
      </tr>
    `
    )
    .join("")

  return `
    <div class="section">
      <h2>${escapeHtml(title)}</h2>
      <table class="checklist-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Responsible</th>
            <th>Deadline</th>
            <th>Category</th>
            <th>Contract Ref.</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `
}

export function generateAnalysisHtmlReport(
  analysis: ContractAnalysisResult,
  documentName: string,
  dealName?: string
): string {
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const missingDatesSection =
    analysis.missingDateDependencies && analysis.missingDateDependencies.length > 0
      ? `
    <div class="section warning-section">
      <h2>⚠️ Missing Date Dependencies</h2>
      <p class="warning-text">The following dates could not be calculated because trigger dates are missing:</p>
      <table class="data-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Depends On</th>
            <th>Days</th>
            <th>Description</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.missingDateDependencies
            .map(
              (dep) => `
            <tr class="priority-${dep.priority.toLowerCase()}">
              <td>${escapeHtml(dep.field)}</td>
              <td>${escapeHtml(dep.dependsOn)}</td>
              <td class="center">${dep.daysFromTrigger}</td>
              <td>${escapeHtml(dep.description)}</td>
              <td class="center priority-badge ${dep.priority.toLowerCase()}">${dep.priority}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : ""

  const warningsSection =
    analysis.warnings && analysis.warnings.length > 0
      ? `
    <div class="section warning-section">
      <h2>⚠️ Analysis Warnings</h2>
      <ul class="warning-list">
        ${analysis.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
      </ul>
    </div>
  `
      : ""

  const preFeasibilitySection = renderChecklistTable(
    analysis.preFeasibilityChecklist || [],
    "📋 Pre-Feasibility Checklist"
  )

  const preClosingSection = renderChecklistTable(
    analysis.preClosingChecklist || [],
    "📋 Pre-Closing Checklist"
  )

  const keyMilestonesSection =
    analysis.keyMilestones && analysis.keyMilestones.length > 0
      ? `
    <div class="section">
      <h2>📅 Key Milestones</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.keyMilestones
            .map(
              (m) => `
            <tr>
              <td>${escapeHtml(m.name)}</td>
              <td class="center">${m.date ? formatDate(m.date) : m.daysFromEffective ? `${m.daysFromEffective} days from effective` : "TBD"}</td>
              <td class="center">${escapeHtml(m.category)}</td>
              <td>${m.description ? escapeHtml(m.description) : ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : ""

  const postClosingSection =
    analysis.postClosingObligations && analysis.postClosingObligations.length > 0
      ? `
    <div class="section">
      <h2>Post-Closing Obligations</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Obligation</th>
            <th>Responsible</th>
            <th>Deadline</th>
            <th>Survives</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.postClosingObligations
            .map(
              (o) => `
            <tr>
              <td>${escapeHtml(o.obligation)}</td>
              <td class="center">${o.responsible}</td>
              <td>${o.deadline ? escapeHtml(o.deadline) : "N/A"}</td>
              <td>${o.survives ? escapeHtml(o.survives) : ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : ""

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contract Analysis - ${escapeHtml(documentName)}</title>
  <style>
    :root {
      --primary-color: #1e40af;
      --secondary-color: #3b82f6;
      --success-color: #059669;
      --warning-color: #d97706;
      --danger-color: #dc2626;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-color: #1e293b;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .header .subtitle {
      opacity: 0.9;
      font-size: 1rem;
    }

    .header .meta {
      margin-top: 1rem;
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .confidence-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    .confidence-high { background-color: #dcfce7; color: #166534; }
    .confidence-medium { background-color: #fef3c7; color: #92400e; }
    .confidence-low { background-color: #fee2e2; color: #991b1b; }

    .section {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section h2 {
      font-size: 1.25rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--border-color);
    }

    .warning-section {
      border-left: 4px solid var(--warning-color);
    }

    .warning-text {
      color: var(--warning-color);
      margin-bottom: 1rem;
    }

    .warning-list {
      list-style: none;
      padding-left: 0;
    }

    .warning-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
    }

    .warning-list li::before {
      content: "⚠";
      position: absolute;
      left: 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .info-card {
      background: var(--bg-color);
      padding: 1rem;
      border-radius: 8px;
    }

    .info-card .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .info-card .value {
      font-size: 1.125rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .info-card .value.large {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    .data-table, .checklist-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th, .checklist-table th {
      background: var(--bg-color);
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color);
    }

    .data-table td, .checklist-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table tr:hover, .checklist-table tr:hover {
      background-color: var(--bg-color);
    }

    .checklist-table tr.critical {
      background-color: #fef2f2;
    }

    .checklist-table tr.critical:hover {
      background-color: #fee2e2;
    }

    .center {
      text-align: center;
    }

    .priority-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .priority-badge.high { background-color: #fee2e2; color: #991b1b; }
    .priority-badge.medium { background-color: #fef3c7; color: #92400e; }
    .priority-badge.low { background-color: #e0f2fe; color: #075985; }

    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .two-column {
        grid-template-columns: 1fr;
      }
    }

    .party-card {
      background: var(--bg-color);
      padding: 1rem;
      border-radius: 8px;
    }

    .party-card h3 {
      font-size: 0.875rem;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }

    .party-card .name {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .party-card .details {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .contingency-item {
      border-left: 3px solid var(--secondary-color);
      padding-left: 1rem;
      margin-bottom: 1rem;
    }

    .contingency-item .name {
      font-weight: 600;
    }

    .contingency-item .description {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .contingency-item .deadline {
      font-size: 0.875rem;
      color: var(--warning-color);
      margin-top: 0.25rem;
    }

    .footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .section {
        break-inside: avoid;
        box-shadow: none;
        border: 1px solid var(--border-color);
      }

      .header {
        background: var(--primary-color);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Contract Analysis Report</h1>
      <div class="subtitle">${escapeHtml(documentName)}${dealName ? ` - ${escapeHtml(dealName)}` : ""}</div>
      <div class="meta">Generated: ${generatedAt}</div>
      <span class="confidence-badge ${analysis.confidence >= 0.8 ? "confidence-high" : analysis.confidence >= 0.6 ? "confidence-medium" : "confidence-low"}">
        ${Math.round(analysis.confidence * 100)}% Confidence
      </span>
    </div>

    ${missingDatesSection}
    ${warningsSection}

    <!-- Parties -->
    <div class="section">
      <h2>Parties</h2>
      <div class="two-column">
        <div class="party-card">
          <h3>Buyer</h3>
          <div class="name">${escapeHtml(analysis.buyer.name)}</div>
          <div class="details">
            ${analysis.buyer.entityType ? escapeHtml(analysis.buyer.entityType) : ""}
            ${analysis.buyer.state ? ` • ${escapeHtml(analysis.buyer.state)}` : ""}
          </div>
          ${analysis.buyer.address ? `<div class="details">${escapeHtml(analysis.buyer.address)}</div>` : ""}
        </div>
        <div class="party-card">
          <h3>Seller</h3>
          <div class="name">${escapeHtml(analysis.seller.name)}</div>
          <div class="details">
            ${analysis.seller.entityType ? escapeHtml(analysis.seller.entityType) : ""}
            ${analysis.seller.state ? ` • ${escapeHtml(analysis.seller.state)}` : ""}
          </div>
          ${analysis.seller.address ? `<div class="details">${escapeHtml(analysis.seller.address)}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- Property -->
    ${
      analysis.propertyAddress
        ? `
    <div class="section">
      <h2>Property</h2>
      <div class="info-card">
        <div class="value">${escapeHtml(analysis.propertyAddress)}</div>
        <div class="details" style="color: var(--text-muted); margin-top: 0.25rem;">
          ${[analysis.propertyCity, analysis.propertyState, analysis.propertyCounty].filter(Boolean).join(", ")}
        </div>
      </div>
      <div class="grid" style="margin-top: 1rem;">
        ${analysis.acreage ? `<div class="info-card"><div class="label">Acreage</div><div class="value">${analysis.acreage}</div></div>` : ""}
        ${analysis.squareFootage ? `<div class="info-card"><div class="label">Square Footage</div><div class="value">${analysis.squareFootage.toLocaleString()} SF</div></div>` : ""}
        ${analysis.lotCount ? `<div class="info-card"><div class="label">Lots</div><div class="value">${analysis.lotCount}</div></div>` : ""}
        ${analysis.unitCount ? `<div class="info-card"><div class="label">Units</div><div class="value">${analysis.unitCount}</div></div>` : ""}
      </div>
    </div>
    `
        : ""
    }

    <!-- Financial Terms -->
    <div class="section">
      <h2>Financial Terms</h2>
      <div class="grid">
        <div class="info-card">
          <div class="label">Purchase Price</div>
          <div class="value large">${formatCurrency(analysis.purchasePrice)}</div>
          ${
            analysis.priceAdjustable
              ? `<div style="color: var(--warning-color); font-size: 0.875rem; margin-top: 0.25rem;">Price Adjustable: ${analysis.priceAdjustmentBasis || "Yes"}</div>`
              : ""
          }
        </div>
        ${analysis.pricePerAcre ? `<div class="info-card"><div class="label">Price Per Acre</div><div class="value">${formatCurrency(analysis.pricePerAcre)}</div></div>` : ""}
        ${analysis.pricePerSquareFoot ? `<div class="info-card"><div class="label">Price Per SF</div><div class="value">${formatCurrency(analysis.pricePerSquareFoot)}</div></div>` : ""}
        ${analysis.pricePerUnit ? `<div class="info-card"><div class="label">Price Per Unit</div><div class="value">${formatCurrency(analysis.pricePerUnit)}</div></div>` : ""}
      </div>
      ${
        analysis.deposits.length > 0
          ? `
      <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 1rem;">Deposits</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Deposit</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Refundable</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.deposits
            .map(
              (d) => `
            <tr>
              <td>${escapeHtml(d.name)}</td>
              <td>${formatCurrency(d.amount)}</td>
              <td>${d.dueDate ? formatDate(d.dueDate) : d.dueDays ? `${d.dueDays} days from ${d.dueFromEvent || "effective date"}` : "N/A"}</td>
              <td>${d.refundable ? `Yes${d.refundableUntil ? ` (until ${escapeHtml(d.refundableUntil)})` : ""}` : "No"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }
    </div>

    <!-- Key Dates -->
    <div class="section">
      <h2>Key Dates</h2>
      <div class="grid">
        ${analysis.effectiveDate ? `<div class="info-card"><div class="label">Effective Date</div><div class="value">${formatDate(analysis.effectiveDate)}</div>${analysis.effectiveDateTrigger ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(analysis.effectiveDateTrigger)}</div>` : ""}</div>` : `<div class="info-card"><div class="label">Effective Date</div><div class="value" style="color: var(--warning-color);">Not Yet Determined</div>${analysis.effectiveDateTrigger ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Trigger: ${escapeHtml(analysis.effectiveDateTrigger)}</div>` : ""}</div>`}
        ${analysis.feasibilityPeriodDays ? `<div class="info-card"><div class="label">Feasibility Period</div><div class="value">${analysis.feasibilityPeriodDays} days</div>${analysis.feasibilityExpiration ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Expires: ${formatDate(analysis.feasibilityExpiration)}</div>` : ""}</div>` : ""}
        ${analysis.closingDate ? `<div class="info-card"><div class="label">Closing Date</div><div class="value">${formatDate(analysis.closingDate)}</div></div>` : analysis.closingDateDays ? `<div class="info-card"><div class="label">Closing Date</div><div class="value">${analysis.closingDateDays} days from ${analysis.closingDateFromEvent || "effective date"}</div></div>` : ""}
        ${analysis.outsideClosingDate ? `<div class="info-card"><div class="label">Outside Closing Date</div><div class="value">${formatDate(analysis.outsideClosingDate)}</div></div>` : ""}
      </div>
      ${
        analysis.titleCommitmentDays || analysis.surveyDays
          ? `
      <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 1rem;">Title & Survey Timeline</h3>
      <div class="grid">
        ${analysis.titleCommitmentDays ? `<div class="info-card"><div class="label">Title Commitment</div><div class="value">${analysis.titleCommitmentDays} days</div>${analysis.titleCommitmentDate ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Due: ${formatDate(analysis.titleCommitmentDate)}</div>` : ""}</div>` : ""}
        ${analysis.surveyDays ? `<div class="info-card"><div class="label">Survey</div><div class="value">${analysis.surveyDays} days</div>${analysis.surveyDate ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Due: ${formatDate(analysis.surveyDate)}</div>` : ""}</div>` : ""}
        ${analysis.titleObjectionDays ? `<div class="info-card"><div class="label">Title Objection Period</div><div class="value">${analysis.titleObjectionDays} days</div></div>` : ""}
        ${analysis.titleCureDays ? `<div class="info-card"><div class="label">Title Cure Period</div><div class="value">${analysis.titleCureDays} days</div></div>` : ""}
      </div>
      `
          : ""
      }
    </div>

    ${preFeasibilitySection}
    ${preClosingSection}
    ${keyMilestonesSection}

    <!-- Contingencies -->
    ${
      analysis.contingencies.length > 0
        ? `
    <div class="section">
      <h2>Contingencies</h2>
      ${analysis.contingencies
        .map(
          (c) => `
        <div class="contingency-item">
          <div class="name">${escapeHtml(c.name)}</div>
          <div class="description">${escapeHtml(c.description)}</div>
          ${c.deadline ? `<div class="deadline">Deadline: ${formatDate(c.deadline)}</div>` : c.deadlineDays ? `<div class="deadline">Deadline: ${c.deadlineDays} days from ${c.deadlineFromEvent || "effective date"}</div>` : ""}
          ${c.consequence ? `<div class="deadline">Consequence: ${escapeHtml(c.consequence)}</div>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Title & Escrow -->
    ${
      analysis.titleCompany || analysis.escrowAgent
        ? `
    <div class="section">
      <h2>Title & Escrow</h2>
      <div class="grid">
        ${analysis.titleCompany ? `<div class="info-card"><div class="label">Title Company</div><div class="value">${escapeHtml(analysis.titleCompany)}</div></div>` : ""}
        ${analysis.escrowAgent ? `<div class="info-card"><div class="label">Escrow Agent</div><div class="value">${escapeHtml(analysis.escrowAgent)}</div></div>` : ""}
      </div>
    </div>
    `
        : ""
    }

    <!-- Special Provisions -->
    ${
      analysis.specialProvisions && analysis.specialProvisions.length > 0
        ? `
    <div class="section">
      <h2>Special Provisions</h2>
      <ul style="margin-left: 1.5rem;">
        ${analysis.specialProvisions.map((p) => `<li style="margin-bottom: 0.5rem;">${escapeHtml(p)}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${postClosingSection}

    <div class="footer">
      <p>This analysis was generated by AI and should be reviewed by a qualified professional.</p>
      <p>Deal Pilot - Contract Analysis Report</p>
    </div>
  </div>
</body>
</html>
`
}
