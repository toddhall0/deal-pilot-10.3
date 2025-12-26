export interface MilestoneTemplate {
  name: string
  description?: string
  daysFromEffective?: number // positive = after, negative = before closing
  daysFromClosing?: number
  children?: MilestoneTemplate[]
}

export const ACQUISITION_TEMPLATE: MilestoneTemplate[] = [
  {
    name: "Effective Date",
    daysFromEffective: 0,
  },
  {
    name: "Opening of Escrow",
    daysFromEffective: 3,
    description: "Deliver earnest money to escrow agent",
  },
  {
    name: "Feasibility Period",
    daysFromEffective: 30,
    description: "Complete all due diligence inspections and reviews",
    children: [
      {
        name: "Order Title Commitment",
        daysFromEffective: 3,
      },
      {
        name: "Order Survey",
        daysFromEffective: 5,
      },
      {
        name: "Order Phase I Environmental",
        daysFromEffective: 5,
      },
      {
        name: "Receive Seller Due Diligence Materials",
        daysFromEffective: 7,
      },
      {
        name: "Complete Property Inspections",
        daysFromEffective: 21,
      },
      {
        name: "Review Financial Records",
        daysFromEffective: 25,
      },
      {
        name: "Feasibility Decision",
        daysFromEffective: 30,
        description: "Decide whether to proceed or terminate",
      },
    ],
  },
  {
    name: "Title Commitment Due",
    daysFromEffective: 14,
  },
  {
    name: "Survey Due",
    daysFromEffective: 21,
  },
  {
    name: "Title Objection Deadline",
    daysFromEffective: 21,
    description: "Deliver title objections to seller",
  },
  {
    name: "Title Cure Period Ends",
    daysFromEffective: 28,
    description: "Seller deadline to cure title objections",
  },
  {
    name: "Financing Contingency",
    daysFromClosing: -14,
    description: "Obtain loan commitment",
  },
  {
    name: "Closing Preparation",
    daysFromClosing: -7,
    children: [
      {
        name: "Order Closing Protection Letter",
        daysFromClosing: -7,
      },
      {
        name: "Prepare Settlement Statement",
        daysFromClosing: -5,
      },
      {
        name: "Review Closing Documents",
        daysFromClosing: -3,
      },
      {
        name: "Final Walk-Through",
        daysFromClosing: -1,
      },
      {
        name: "Wire Funds",
        daysFromClosing: -1,
      },
    ],
  },
  {
    name: "Closing Date",
    daysFromClosing: 0,
    description: "Execute closing documents and transfer ownership",
  },
]

export function instantiateTemplate(
  template: MilestoneTemplate[],
  effectiveDate: Date,
  closingDate: Date
): Array<{
  name: string
  description?: string
  dueDate: Date
  children?: Array<{ name: string; description?: string; dueDate: Date }>
}> {
  return template.map((item) => {
    let dueDate: Date

    if (item.daysFromEffective !== undefined) {
      dueDate = new Date(effectiveDate)
      dueDate.setDate(dueDate.getDate() + item.daysFromEffective)
    } else if (item.daysFromClosing !== undefined) {
      dueDate = new Date(closingDate)
      dueDate.setDate(dueDate.getDate() + item.daysFromClosing)
    } else {
      dueDate = new Date(effectiveDate)
    }

    const result: any = {
      name: item.name,
      description: item.description,
      dueDate,
    }

    if (item.children) {
      result.children = item.children.map((child) => {
        let childDueDate: Date

        if (child.daysFromEffective !== undefined) {
          childDueDate = new Date(effectiveDate)
          childDueDate.setDate(childDueDate.getDate() + child.daysFromEffective)
        } else if (child.daysFromClosing !== undefined) {
          childDueDate = new Date(closingDate)
          childDueDate.setDate(childDueDate.getDate() + child.daysFromClosing)
        } else {
          childDueDate = new Date(dueDate)
        }

        return {
          name: child.name,
          description: child.description,
          dueDate: childDueDate,
        }
      })
    }

    return result
  })
}
