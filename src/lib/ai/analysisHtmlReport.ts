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

function formatDateForInput(date: string | undefined): string {
  if (!date) return ""
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function renderChecklistTable(items: ChecklistItem[], title: string, tableId: string): string {
  if (!items || items.length === 0) return ""

  const rows = items
    .map(
      (item, idx) => `
      <tr class="${item.isCritical ? "critical" : ""}" data-row-id="${tableId}-${idx}">
        <td>
          <input type="text" class="editable-input" value="${escapeHtml(item.item)}" data-field="name" />
        </td>
        <td class="center">${item.responsible}</td>
        <td class="center">
          ${item.deadline
            ? `<input type="date" class="date-input" value="${formatDateForInput(item.deadline)}" data-field="date" data-days="${item.deadlineDays || ''}" data-from="${item.deadlineFromEvent || 'effectiveDate'}" />`
            : item.deadlineDays
              ? `<input type="date" class="date-input calculated" value="" data-field="date" data-days="${item.deadlineDays}" data-from="${item.deadlineFromEvent || 'effectiveDate'}" placeholder="${item.deadlineDays} days from ${item.deadlineFromEvent || 'effective date'}" />`
              : 'N/A'
          }
        </td>
        <td>${escapeHtml(item.category)}</td>
        <td class="actions">
          <button class="btn-add-milestone" onclick="addToMilestones('${tableId}-${idx}', '${escapeHtml(item.item)}', '${item.category}')" title="Add to Milestones">➕</button>
          <button class="btn-delete" onclick="deleteRow('${tableId}-${idx}')" title="Delete">🗑️</button>
        </td>
      </tr>
    `
    )
    .join("")

  return `
    <div class="section">
      <h2>${escapeHtml(title)}</h2>
      <table class="checklist-table interactive-table" id="${tableId}">
        <thead>
          <tr>
            <th>Item</th>
            <th>Responsible</th>
            <th>Deadline</th>
            <th>Category</th>
            <th>Actions</th>
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
  dealName?: string,
  dealId?: string,
  documentId?: string
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
    "📋 Pre-Feasibility Checklist",
    "preFeasibility"
  )

  const preClosingSection = renderChecklistTable(
    analysis.preClosingChecklist || [],
    "📋 Pre-Closing Checklist",
    "preClosing"
  )

  const keyMilestonesSection =
    analysis.keyMilestones && analysis.keyMilestones.length > 0
      ? `
    <div class="section">
      <h2>📅 Key Milestones</h2>
      <table class="data-table interactive-table" id="keyMilestones">
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.keyMilestones
            .map(
              (m, idx) => `
            <tr data-row-id="milestone-${idx}">
              <td>
                <input type="text" class="editable-input" value="${escapeHtml(m.name)}" data-field="name" />
              </td>
              <td class="center">
                ${m.date
                  ? `<input type="date" class="date-input" value="${formatDateForInput(m.date)}" data-field="date" data-days="${m.daysFromEffective || ''}" data-from="effectiveDate" />`
                  : m.daysFromEffective
                    ? `<input type="date" class="date-input calculated" value="" data-field="date" data-days="${m.daysFromEffective}" data-from="effectiveDate" placeholder="${m.daysFromEffective} days" />`
                    : `<input type="date" class="date-input" value="" data-field="date" />`
                }
              </td>
              <td class="center">${escapeHtml(m.category)}</td>
              <td>
                <input type="text" class="editable-input description" value="${m.description ? escapeHtml(m.description) : ''}" data-field="description" placeholder="Description" />
              </td>
              <td class="actions">
                <button class="btn-add-milestone" onclick="addToMilestones('milestone-${idx}', '${escapeHtml(m.name)}', '${m.category}')" title="Add to Milestones">➕</button>
                <button class="btn-delete" onclick="deleteRow('milestone-${idx}')" title="Delete">🗑️</button>
              </td>
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
      <table class="data-table interactive-table" id="postClosing">
        <thead>
          <tr>
            <th>Obligation</th>
            <th>Responsible</th>
            <th>Deadline</th>
            <th>Survives</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.postClosingObligations
            .map(
              (o, idx) => `
            <tr data-row-id="postClosing-${idx}">
              <td>
                <input type="text" class="editable-input" value="${escapeHtml(o.obligation)}" data-field="name" />
              </td>
              <td class="center">${o.responsible}</td>
              <td>
                <input type="date" class="date-input" value="" data-field="date" placeholder="${o.deadline || 'N/A'}" />
              </td>
              <td>${o.survives ? escapeHtml(o.survives) : ""}</td>
              <td class="actions">
                <button class="btn-add-milestone" onclick="addToMilestones('postClosing-${idx}', '${escapeHtml(o.obligation)}', 'POST_CLOSING')" title="Add to Milestones">➕</button>
                <button class="btn-delete" onclick="deleteRow('postClosing-${idx}')" title="Delete">🗑️</button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : ""

  // Key dates section with editable inputs
  const keyDatesRows = []

  if (analysis.effectiveDate || analysis.effectiveDateTrigger) {
    keyDatesRows.push({
      name: "Effective Date",
      date: analysis.effectiveDate,
      days: null,
      from: null,
      category: "CONTRACT",
      id: "effectiveDate",
      isBase: true
    })
  }

  if (analysis.feasibilityPeriodDays || analysis.feasibilityExpiration) {
    keyDatesRows.push({
      name: "Feasibility Expiration",
      date: analysis.feasibilityExpiration,
      days: analysis.feasibilityPeriodDays,
      from: "effectiveDate",
      category: "FEASIBILITY",
      id: "feasibilityExpiration"
    })
  }

  if (analysis.closingDate || analysis.closingDateDays) {
    keyDatesRows.push({
      name: "Closing Date",
      date: analysis.closingDate,
      days: analysis.closingDateDays,
      from: analysis.closingDateFromEvent || "effectiveDate",
      category: "CLOSING",
      id: "closingDate"
    })
  }

  if (analysis.outsideClosingDate) {
    keyDatesRows.push({
      name: "Outside Closing Date",
      date: analysis.outsideClosingDate,
      days: null,
      from: null,
      category: "CLOSING",
      id: "outsideClosingDate"
    })
  }

  if (analysis.titleCommitmentDays || analysis.titleCommitmentDate) {
    keyDatesRows.push({
      name: "Title Commitment Due",
      date: analysis.titleCommitmentDate,
      days: analysis.titleCommitmentDays,
      from: "effectiveDate",
      category: "TITLE",
      id: "titleCommitmentDate"
    })
  }

  if (analysis.surveyDays || analysis.surveyDate) {
    keyDatesRows.push({
      name: "Survey Due",
      date: analysis.surveyDate,
      days: analysis.surveyDays,
      from: "effectiveDate",
      category: "SURVEY",
      id: "surveyDate"
    })
  }

  if (analysis.titleObjectionDays || analysis.titleObjectionDate) {
    keyDatesRows.push({
      name: "Title Objection Deadline",
      date: analysis.titleObjectionDate,
      days: analysis.titleObjectionDays,
      from: "effectiveDate",
      category: "TITLE",
      id: "titleObjectionDate"
    })
  }

  const keyDatesTableRows = keyDatesRows.map((row, idx) => `
    <tr data-row-id="keyDate-${row.id}" ${row.isBase ? 'class="base-date"' : ''}>
      <td>
        <input type="text" class="editable-input" value="${escapeHtml(row.name)}" data-field="name" />
      </td>
      <td class="center">
        <input type="date" class="date-input ${row.isBase ? 'base-date-input' : ''}"
          id="date-${row.id}"
          value="${formatDateForInput(row.date)}"
          data-field="date"
          data-days="${row.days || ''}"
          data-from="${row.from || ''}"
          data-id="${row.id}"
          ${row.isBase ? 'onchange="recalculateAllDates()"' : ''}
        />
        ${row.days ? `<span class="days-label">(${row.days} days)</span>` : ''}
      </td>
      <td class="center">${row.category}</td>
      <td class="actions">
        <button class="btn-add-milestone" onclick="addToMilestones('keyDate-${row.id}', document.querySelector('#date-${row.id}').parentElement.parentElement.querySelector('[data-field=name]').value, '${row.category}')" title="Add to Milestones">➕</button>
        <button class="btn-delete" onclick="deleteRow('keyDate-${row.id}')" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join("")

  // Deposits section
  const depositsRows = analysis.deposits?.map((d, idx) => `
    <tr data-row-id="deposit-${idx}">
      <td>
        <input type="text" class="editable-input" value="${escapeHtml(d.name)}" data-field="name" />
      </td>
      <td>${formatCurrency(d.amount)}</td>
      <td>
        <input type="date" class="date-input"
          value="${formatDateForInput(d.dueDate)}"
          data-field="date"
          data-days="${d.dueDays || ''}"
          data-from="${d.dueFromEvent || 'effectiveDate'}"
        />
        ${d.dueDays ? `<span class="days-label">(${d.dueDays} days)</span>` : ''}
      </td>
      <td>${d.refundable ? `Yes${d.refundableUntil ? ` (until ${escapeHtml(d.refundableUntil)})` : ""}` : "No"}</td>
      <td class="actions">
        <button class="btn-add-milestone" onclick="addToMilestones('deposit-${idx}', '${escapeHtml(d.name)} Due', 'CONTRACT')" title="Add to Milestones">➕</button>
        <button class="btn-delete" onclick="deleteRow('deposit-${idx}')" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join("") || ""

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

    /* Interactive Styles */
    .editable-input {
      border: 1px solid transparent;
      background: transparent;
      padding: 0.25rem 0.5rem;
      font-size: inherit;
      font-family: inherit;
      width: 100%;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .editable-input:hover {
      border-color: var(--border-color);
      background: white;
    }

    .editable-input:focus {
      outline: none;
      border-color: var(--secondary-color);
      background: white;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .editable-input.description {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .date-input {
      border: 1px solid var(--border-color);
      background: white;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      font-family: inherit;
      border-radius: 4px;
      cursor: pointer;
    }

    .date-input:focus {
      outline: none;
      border-color: var(--secondary-color);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .date-input.calculated:not([value=""]) {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .date-input.base-date-input {
      background: #eff6ff;
      border-color: var(--secondary-color);
      font-weight: 600;
    }

    .days-label {
      display: block;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    tr.base-date {
      background: #eff6ff !important;
    }

    .actions {
      white-space: nowrap;
      text-align: center;
    }

    .btn-add-milestone, .btn-delete {
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 1rem;
      opacity: 0.6;
      transition: opacity 0.2s, transform 0.2s;
    }

    .btn-add-milestone:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .btn-delete:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .btn-add-milestone.added {
      opacity: 0.3;
      cursor: default;
    }

    tr.deleted {
      display: none;
    }

    .import-all-btn {
      background: var(--success-color);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .import-all-btn:hover {
      background: #047857;
    }

    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--success-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 1000;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .effective-date-banner {
      background: #eff6ff;
      border: 2px solid var(--secondary-color);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .effective-date-banner label {
      font-weight: 600;
      color: var(--primary-color);
    }

    .effective-date-banner input {
      padding: 0.5rem;
      font-size: 1rem;
      border: 2px solid var(--secondary-color);
      border-radius: 6px;
    }

    .effective-date-banner button {
      background: var(--secondary-color);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }

    .effective-date-banner button:hover {
      background: var(--primary-color);
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

      .actions, .effective-date-banner, .import-all-btn {
        display: none !important;
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

    <!-- Effective Date Input Banner -->
    <div class="effective-date-banner">
      <label for="effectiveDateInput">📅 Set Effective Date to Calculate All Dependent Dates:</label>
      <input type="date" id="effectiveDateInput" value="${formatDateForInput(analysis.effectiveDate)}" />
      <button onclick="recalculateAllDates()">Calculate Dates</button>
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
        analysis.deposits && analysis.deposits.length > 0
          ? `
      <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 1rem;">Deposits</h3>
      <table class="data-table interactive-table" id="deposits">
        <thead>
          <tr>
            <th>Deposit</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Refundable</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${depositsRows}
        </tbody>
      </table>
      `
          : ""
      }
    </div>

    <!-- Key Dates -->
    <div class="section">
      <h2>Key Dates & Deadlines</h2>
      <p style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.875rem;">
        💡 Enter the Effective Date above to auto-calculate all dependent dates. Click ➕ to add any date to your milestones.
      </p>
      <table class="data-table interactive-table" id="keyDates">
        <thead>
          <tr>
            <th>Date Name</th>
            <th>Date</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${keyDatesTableRows}
        </tbody>
      </table>
      <button class="import-all-btn" onclick="importAllKeyDates()">
        📅 Import All Key Dates to Milestones
      </button>
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

  <div class="toast" id="toast"></div>

  <script>
    // Store deal info for API calls
    const dealId = "${dealId || ''}";
    const documentId = "${documentId || ''}";

    // Show toast notification
    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Delete a row
    function deleteRow(rowId) {
      const row = document.querySelector(\`[data-row-id="\${rowId}"]\`);
      if (row && confirm('Delete this item?')) {
        row.classList.add('deleted');
        showToast('Item deleted');
      }
    }

    // Add single item to milestones
    function addToMilestones(rowId, defaultName, category) {
      const row = document.querySelector(\`[data-row-id="\${rowId}"]\`);
      if (!row) return;

      const nameInput = row.querySelector('[data-field="name"]');
      const dateInput = row.querySelector('[data-field="date"]');
      const descInput = row.querySelector('[data-field="description"]');
      const btn = row.querySelector('.btn-add-milestone');

      const name = nameInput ? nameInput.value : defaultName;
      const date = dateInput ? dateInput.value : '';
      const description = descInput ? descInput.value : '';

      if (!date) {
        alert('Please enter a date before adding to milestones');
        return;
      }

      // Send message to parent window
      window.parent.postMessage({
        type: 'ADD_MILESTONE',
        payload: {
          name: name,
          date: date,
          description: description,
          category: category,
          dealId: dealId,
          documentId: documentId
        }
      }, '*');

      // Visual feedback
      if (btn) {
        btn.classList.add('added');
        btn.textContent = '✓';
      }
      showToast(\`Added "\${name}" to milestones\`);
    }

    // Import all key dates
    function importAllKeyDates() {
      const rows = document.querySelectorAll('#keyDates tbody tr:not(.deleted)');
      const milestones = [];

      rows.forEach(row => {
        const nameInput = row.querySelector('[data-field="name"]');
        const dateInput = row.querySelector('[data-field="date"]');
        const category = row.cells[2]?.textContent?.trim() || 'CONTRACT';

        if (nameInput && dateInput && dateInput.value) {
          milestones.push({
            name: nameInput.value,
            date: dateInput.value,
            description: '',
            category: category
          });
        }
      });

      if (milestones.length === 0) {
        alert('No dates to import. Please enter dates first.');
        return;
      }

      window.parent.postMessage({
        type: 'IMPORT_MILESTONES',
        payload: {
          milestones: milestones,
          dealId: dealId,
          documentId: documentId
        }
      }, '*');

      showToast(\`Importing \${milestones.length} milestones...\`);
    }

    // Recalculate all dependent dates from effective date
    function recalculateAllDates() {
      const effectiveDateInput = document.getElementById('effectiveDateInput');
      const effectiveDate = effectiveDateInput.value;

      if (!effectiveDate) {
        alert('Please enter an effective date');
        return;
      }

      const baseDate = new Date(effectiveDate);

      // Update the effectiveDate field in the key dates table
      const effectiveDateField = document.getElementById('date-effectiveDate');
      if (effectiveDateField) {
        effectiveDateField.value = effectiveDate;
      }

      // Find all date inputs with data-days attribute and calculate
      document.querySelectorAll('.date-input[data-days]').forEach(input => {
        const days = parseInt(input.dataset.days);
        const fromField = input.dataset.from;

        if (!days || isNaN(days)) return;

        // Get base date (either effective date or another field)
        let calcFromDate = baseDate;
        if (fromField && fromField !== 'effectiveDate') {
          const fromInput = document.getElementById(\`date-\${fromField}\`);
          if (fromInput && fromInput.value) {
            calcFromDate = new Date(fromInput.value);
          }
        }

        // Calculate new date
        const newDate = new Date(calcFromDate);
        newDate.setDate(newDate.getDate() + days);

        // Format as YYYY-MM-DD
        input.value = newDate.toISOString().split('T')[0];
        input.classList.add('calculated');
      });

      showToast('All dates recalculated');
    }

    // Listen for responses from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'MILESTONE_ADDED') {
        showToast(event.data.message || 'Milestone added successfully');
      } else if (event.data.type === 'MILESTONES_IMPORTED') {
        showToast(event.data.message || 'Milestones imported successfully');
      } else if (event.data.type === 'ERROR') {
        alert(event.data.message || 'An error occurred');
      }
    });

    // Auto-calculate dates on load if effective date exists
    if (document.getElementById('effectiveDateInput').value) {
      recalculateAllDates();
    }
  </script>
</body>
</html>
`
}
