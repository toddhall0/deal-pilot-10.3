const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface BaseEmailData {
  recipientName: string
}

interface TaskEmailData extends BaseEmailData {
  taskTitle: string
  dealNumber: string
  dueDate?: string
  assignedBy?: string
  actionUrl: string
}

interface MilestoneEmailData extends BaseEmailData {
  milestoneName: string
  dealNumber: string
  propertyName?: string
  dueDate?: string
  actionUrl: string
}

interface DealEmailData extends BaseEmailData {
  dealNumber: string
  propertyName?: string
  newStatus?: string
  previousStatus?: string
  actionUrl: string
}

interface DepositEmailData extends BaseEmailData {
  depositName: string
  amount: string
  dealNumber: string
  dueDate: string
  actionUrl: string
}

// Base email wrapper
function emailWrapper(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deal Pilot Notification</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#3b82f6;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;">Deal Pilot</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                You received this email because you have notifications enabled.
                <br>
                <a href="${APP_URL}/settings/notifications" style="color:#3b82f6;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function actionButton(text: string, url: string): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#3b82f6;border-radius:6px;padding:12px 24px;">
      <a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:500;display:inline-block;">${text}</a>
    </td>
  </tr>
</table>`
}

// Task Templates
export function taskAssignedEmail(data: TaskEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">New Task Assigned</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  You have been assigned a new task${data.assignedBy ? ` by ${data.assignedBy}` : ""}:
</p>
<div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.taskTitle}</p>
  <p style="margin:0;color:#6b7280;font-size:14px;">Deal: ${data.dealNumber}</p>
  ${data.dueDate ? `<p style="margin:4px 0 0;color:#6b7280;font-size:14px;">Due: ${data.dueDate}</p>` : ""}
</div>
${actionButton("View Task", data.actionUrl)}`

  return emailWrapper(content, `New task: ${data.taskTitle}`)
}

export function taskDueSoonEmail(data: TaskEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">⏰ Task Due Soon</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  You have a task due soon:
</p>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.taskTitle}</p>
  <p style="margin:0;color:#6b7280;font-size:14px;">Deal: ${data.dealNumber}</p>
  <p style="margin:4px 0 0;color:#92400e;font-size:14px;font-weight:500;">Due: ${data.dueDate}</p>
</div>
${actionButton("View Task", data.actionUrl)}`

  return emailWrapper(content, `Task due soon: ${data.taskTitle}`)
}

export function taskOverdueEmail(data: TaskEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#dc2626;font-size:20px;">🚨 Task Overdue</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  The following task is now overdue:
</p>
<div style="background-color:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.taskTitle}</p>
  <p style="margin:0;color:#6b7280;font-size:14px;">Deal: ${data.dealNumber}</p>
  <p style="margin:4px 0 0;color:#dc2626;font-size:14px;font-weight:500;">Was due: ${data.dueDate}</p>
</div>
${actionButton("View Task", data.actionUrl)}`

  return emailWrapper(content, `OVERDUE: ${data.taskTitle}`)
}

// Milestone Templates
export function milestoneDueSoonEmail(data: MilestoneEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">📅 Milestone Approaching</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  A milestone is due soon on one of your deals:
</p>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.milestoneName}</p>
  <p style="margin:0;color:#6b7280;font-size:14px;">Deal: ${data.dealNumber}${data.propertyName ? ` - ${data.propertyName}` : ""}</p>
  <p style="margin:4px 0 0;color:#92400e;font-size:14px;font-weight:500;">Due: ${data.dueDate}</p>
</div>
${actionButton("View Timeline", data.actionUrl)}`

  return emailWrapper(content, `Milestone due soon: ${data.milestoneName}`)
}

// Deal Templates
export function dealStatusChangedEmail(data: DealEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Deal Status Updated</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  A deal status has been updated:
</p>
<div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.dealNumber}${data.propertyName ? ` - ${data.propertyName}` : ""}</p>
  <p style="margin:0;color:#6b7280;font-size:14px;">
    ${data.previousStatus} → <span style="color:#059669;font-weight:500;">${data.newStatus}</span>
  </p>
</div>
${actionButton("View Deal", data.actionUrl)}`

  return emailWrapper(content, `Deal ${data.dealNumber} status: ${data.newStatus}`)
}

// Deposit Templates
export function depositDueSoonEmail(data: DepositEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">💰 Deposit Due Soon</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  An earnest money deposit is due soon:
</p>
<div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.depositName}</p>
  <p style="margin:0;color:#111827;font-size:18px;font-weight:600;">${data.amount}</p>
  <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Deal: ${data.dealNumber}</p>
  <p style="margin:4px 0 0;color:#92400e;font-size:14px;font-weight:500;">Due: ${data.dueDate}</p>
</div>
${actionButton("View Financials", data.actionUrl)}`

  return emailWrapper(content, `Deposit due: ${data.amount} for ${data.dealNumber}`)
}

// Closing Reminder Template
export function closingReminderEmail(data: MilestoneEmailData): string {
  const content = `
<h2 style="margin:0 0 16px;color:#111827;font-size:20px;">🏠 Closing Date Approaching</h2>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  Hi ${data.recipientName},
</p>
<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
  A closing date is approaching:
</p>
<div style="background-color:#dcfce7;border-left:4px solid #22c55e;padding:16px;margin:16px 0;">
  <p style="margin:0 0 8px;font-weight:600;color:#111827;">${data.dealNumber}${data.propertyName ? ` - ${data.propertyName}` : ""}</p>
  <p style="margin:4px 0 0;color:#166534;font-size:14px;font-weight:500;">Closing: ${data.dueDate}</p>
</div>
<p style="margin:16px 0;color:#4b5563;line-height:1.6;">
  Make sure all closing documents are prepared and reviewed.
</p>
${actionButton("View Deal", data.actionUrl)}`

  return emailWrapper(content, `Closing soon: ${data.dealNumber}`)
}

export const EmailTemplates = {
  taskAssigned: taskAssignedEmail,
  taskDueSoon: taskDueSoonEmail,
  taskOverdue: taskOverdueEmail,
  milestoneDueSoon: milestoneDueSoonEmail,
  dealStatusChanged: dealStatusChangedEmail,
  depositDueSoon: depositDueSoonEmail,
  closingReminder: closingReminderEmail,
}
