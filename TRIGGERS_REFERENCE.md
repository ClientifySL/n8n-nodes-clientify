# Clientify Triggers - Complete Reference

**Package:** n8n-nodes-clientify v0.2.0
**Total Triggers:** 16

---

## How Triggers Work

1. **Create workflow** in n8n with Clientify Trigger node
2. **Select event** (e.g., "Contact Created")
3. **Activate workflow** → Get webhook URL
4. **Configure in Clientify** → Point event to webhook URL
5. **Event happens** → Workflow runs automatically

**Webhook URL Format:**
```
https://your-n8n-instance.com/webhook/{unique-workflow-id}/webhook
```

Each workflow gets a unique URL when activated.

---

## 👥 Contact Triggers

### 1. Contact Created

**Event:** `contact.created`
**When:** New contact added to Clientify

**Input Payload:**
```json
{
  "event": "contact.created",
  "timestamp": "2025-10-02T15:30:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "contact": {
      "id": 12345,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "company_id": 456,
      "company_name": "Acme Corp",
      "created_at": "2025-10-02T15:30:00Z"
    }
  }
}
```

**Output (Available in Workflow):**
```json
{
  "event": "contact.created",
  "timestamp": "2025-10-02T15:30:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "contact_id": 12345,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "company_id": 456,
  "company_name": "Acme Corp",
  "created_at": "2025-10-02T15:30:00Z",
  "_raw": { /* original payload */ }
}
```

**Access Data:** `{{$json.first_name}}`, `{{$json.email}}`, etc.

---

### 2. Contact Updated

**Event:** `contact.updated`
**When:** Contact details modified

**Input Payload:**
```json
{
  "event": "contact.updated",
  "timestamp": "2025-10-02T16:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "contact": {
      "id": 12345,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.new@example.com",
      "phone": "+1234567890",
      "company_id": 789,
      "company_name": "New Corp",
      "updated_at": "2025-10-02T16:00:00Z"
    },
    "changes": {
      "email": {
        "old": "john.doe@example.com",
        "new": "john.new@example.com"
      },
      "company_id": {
        "old": 456,
        "new": 789
      }
    }
  }
}
```

**Output:**
```json
{
  "event": "contact.updated",
  "timestamp": "2025-10-02T16:00:00Z",
  "contact_id": 12345,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.new@example.com",
  "phone": "+1234567890",
  "company_id": 789,
  "company_name": "New Corp",
  "updated_at": "2025-10-02T16:00:00Z",
  "changes": {
    "email": { "old": "john.doe@example.com", "new": "john.new@example.com" },
    "company_id": { "old": 456, "new": 789 }
  },
  "_raw": { /* original payload */ }
}
```

**Access Changes:** `{{$json.changes.email.old}}`, `{{$json.changes.email.new}}`

---

### 3. Contact Deleted

**Event:** `contact.deleted`
**When:** Contact removed from Clientify

**Input Payload:**
```json
{
  "event": "contact.deleted",
  "timestamp": "2025-10-02T17:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "contact": {
      "id": 12345,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

**Output:**
```json
{
  "event": "contact.deleted",
  "timestamp": "2025-10-02T17:00:00Z",
  "contact_id": 12345,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "_raw": { /* original payload */ }
}
```

---

## 📊 Company Triggers

### 4. Company Created

**Event:** `company.created`
**When:** New company added to Clientify

**Input Payload:**
```json
{
  "event": "company.created",
  "timestamp": "2025-10-02T18:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "company": {
      "id": 999,
      "name": "Tech Startup Inc",
      "domain": "techstartup.com",
      "industry": "Technology",
      "size": "50-100",
      "country": "USA",
      "created_at": "2025-10-02T18:00:00Z"
    }
  }
}
```

**Output:**
```json
{
  "event": "company.created",
  "timestamp": "2025-10-02T18:00:00Z",
  "company_id": 999,
  "name": "Tech Startup Inc",
  "domain": "techstartup.com",
  "industry": "Technology",
  "size": "50-100",
  "country": "USA",
  "created_at": "2025-10-02T18:00:00Z",
  "_raw": { /* original payload */ }
}
```

**Access Data:** `{{$json.name}}`, `{{$json.domain}}`, `{{$json.industry}}`

---

### 5. Company Updated

**Event:** `company.updated`
**When:** Company details modified

**Input Payload:**
```json
{
  "event": "company.updated",
  "timestamp": "2025-10-02T19:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "company": {
      "id": 999,
      "name": "Tech Startup Inc",
      "domain": "newdomain.com",
      "industry": "SaaS",
      "updated_at": "2025-10-02T19:00:00Z"
    },
    "changes": {
      "domain": { "old": "techstartup.com", "new": "newdomain.com" },
      "industry": { "old": "Technology", "new": "SaaS" }
    }
  }
}
```

**Output:**
```json
{
  "event": "company.updated",
  "timestamp": "2025-10-02T19:00:00Z",
  "company_id": 999,
  "name": "Tech Startup Inc",
  "domain": "newdomain.com",
  "industry": "SaaS",
  "updated_at": "2025-10-02T19:00:00Z",
  "changes": {
    "domain": { "old": "techstartup.com", "new": "newdomain.com" },
    "industry": { "old": "Technology", "new": "SaaS" }
  },
  "_raw": { /* original payload */ }
}
```

---

### 6. Company Deleted

**Event:** `company.deleted`
**When:** Company removed from Clientify

**Input Payload:**
```json
{
  "event": "company.deleted",
  "timestamp": "2025-10-02T20:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "company": {
      "id": 999,
      "name": "Tech Startup Inc"
    }
  }
}
```

**Output:**
```json
{
  "event": "company.deleted",
  "timestamp": "2025-10-02T20:00:00Z",
  "company_id": 999,
  "name": "Tech Startup Inc",
  "_raw": { /* original payload */ }
}
```

---

## 💼 Deal Triggers

### 7. Deal Created

**Event:** `deal.created`
**When:** New deal/opportunity created

**Input Payload:**
```json
{
  "event": "deal.created",
  "timestamp": "2025-10-02T21:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "deal": {
      "id": 98765,
      "title": "Enterprise License Sale",
      "value": 50000,
      "currency": "USD",
      "contact_id": 12345,
      "contact_name": "John Doe",
      "company_id": 999,
      "company_name": "Tech Startup Inc",
      "pipeline_id": 1,
      "pipeline_name": "Sales Pipeline",
      "stage_id": 3,
      "stage_name": "Proposal",
      "created_at": "2025-10-02T21:00:00Z"
    }
  }
}
```

**Output:**
```json
{
  "event": "deal.created",
  "timestamp": "2025-10-02T21:00:00Z",
  "deal_id": 98765,
  "title": "Enterprise License Sale",
  "value": 50000,
  "currency": "USD",
  "contact_id": 12345,
  "contact_name": "John Doe",
  "company_id": 999,
  "company_name": "Tech Startup Inc",
  "pipeline_id": 1,
  "pipeline_name": "Sales Pipeline",
  "stage_id": 3,
  "stage_name": "Proposal",
  "created_at": "2025-10-02T21:00:00Z",
  "_raw": { /* original payload */ }
}
```

**Access Data:** `{{$json.title}}`, `{{$json.value}}`, `{{$json.stage_name}}`

---

### 8. Deal Updated

**Event:** `deal.updated`
**When:** Deal details modified

**Input Payload:**
```json
{
  "event": "deal.updated",
  "timestamp": "2025-10-02T22:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "deal": {
      "id": 98765,
      "title": "Enterprise License Sale",
      "value": 60000,
      "currency": "USD",
      "stage_name": "Negotiation",
      "updated_at": "2025-10-02T22:00:00Z"
    },
    "changes": {
      "value": { "old": 50000, "new": 60000 },
      "stage_name": { "old": "Proposal", "new": "Negotiation" }
    }
  }
}
```

**Output:**
```json
{
  "event": "deal.updated",
  "timestamp": "2025-10-02T22:00:00Z",
  "deal_id": 98765,
  "title": "Enterprise License Sale",
  "value": 60000,
  "currency": "USD",
  "stage_name": "Negotiation",
  "updated_at": "2025-10-02T22:00:00Z",
  "changes": {
    "value": { "old": 50000, "new": 60000 },
    "stage_name": { "old": "Proposal", "new": "Negotiation" }
  },
  "_raw": { /* original payload */ }
}
```

---

### 9. Deal Won

**Event:** `deal.won`
**When:** Deal marked as won/closed successfully

**Input Payload:**
```json
{
  "event": "deal.won",
  "timestamp": "2025-10-02T23:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "deal": {
      "id": 98765,
      "title": "Enterprise License Sale",
      "value": 60000,
      "currency": "USD",
      "contact_id": 12345,
      "contact_name": "John Doe",
      "company_id": 999,
      "company_name": "Tech Startup Inc",
      "stage_name": "Won",
      "won_at": "2025-10-02T23:00:00Z"
    }
  }
}
```

**Output:**
```json
{
  "event": "deal.won",
  "timestamp": "2025-10-02T23:00:00Z",
  "deal_id": 98765,
  "title": "Enterprise License Sale",
  "value": 60000,
  "currency": "USD",
  "contact_id": 12345,
  "contact_name": "John Doe",
  "company_id": 999,
  "company_name": "Tech Startup Inc",
  "stage_name": "Won",
  "won_at": "2025-10-02T23:00:00Z",
  "_raw": { /* original payload */ }
}
```

**Use Case:** Send celebration email, create onboarding task, post to Slack

---

### 10. Deal Lost

**Event:** `deal.lost`
**When:** Deal marked as lost/closed unsuccessfully

**Input Payload:**
```json
{
  "event": "deal.lost",
  "timestamp": "2025-10-03T00:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "deal": {
      "id": 98766,
      "title": "SMB Deal",
      "value": 5000,
      "currency": "USD",
      "contact_id": 12346,
      "contact_name": "Jane Smith",
      "stage_name": "Lost",
      "lost_at": "2025-10-03T00:00:00Z",
      "lost_reason": "Budget constraints"
    }
  }
}
```

**Output:**
```json
{
  "event": "deal.lost",
  "timestamp": "2025-10-03T00:00:00Z",
  "deal_id": 98766,
  "title": "SMB Deal",
  "value": 5000,
  "currency": "USD",
  "contact_id": 12346,
  "contact_name": "Jane Smith",
  "stage_name": "Lost",
  "lost_at": "2025-10-03T00:00:00Z",
  "lost_reason": "Budget constraints",
  "_raw": { /* original payload */ }
}
```

**Use Case:** Add to nurture campaign, schedule follow-up in 6 months

---

### 11. Deal Stage Changed

**Event:** `deal.stage_changed`
**When:** Deal moves to different pipeline stage

**Input Payload:**
```json
{
  "event": "deal.stage_changed",
  "timestamp": "2025-10-03T01:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "deal": {
      "id": 98765,
      "title": "Enterprise License Sale",
      "value": 60000,
      "stage_id": 4,
      "stage_name": "Contract",
      "previous_stage_id": 3,
      "previous_stage_name": "Negotiation"
    },
    "changes": {
      "stage_name": { "old": "Negotiation", "new": "Contract" }
    }
  }
}
```

**Output:**
```json
{
  "event": "deal.stage_changed",
  "timestamp": "2025-10-03T01:00:00Z",
  "deal_id": 98765,
  "title": "Enterprise License Sale",
  "value": 60000,
  "stage_id": 4,
  "stage_name": "Contract",
  "previous_stage_id": 3,
  "previous_stage_name": "Negotiation",
  "changes": {
    "stage_name": { "old": "Negotiation", "new": "Contract" }
  },
  "_raw": { /* original payload */ }
}
```

**Use Case:** Different actions per stage (Proposal → send pricing, Contract → generate document)

---

### 12. Deal Deleted

**Event:** `deal.deleted`
**When:** Deal removed from Clientify

**Input Payload:**
```json
{
  "event": "deal.deleted",
  "timestamp": "2025-10-03T02:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "deal": {
      "id": 98767,
      "title": "Canceled Deal"
    }
  }
}
```

**Output:**
```json
{
  "event": "deal.deleted",
  "timestamp": "2025-10-03T02:00:00Z",
  "deal_id": 98767,
  "title": "Canceled Deal",
  "_raw": { /* original payload */ }
}
```

---

## ✅ Task Triggers

### 13. Task Created

**Event:** `task.created`
**When:** New task/activity created

**Input Payload:**
```json
{
  "event": "task.created",
  "timestamp": "2025-10-03T03:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "task": {
      "id": 5555,
      "title": "Follow up with John Doe",
      "description": "Discuss pricing options",
      "type": "call",
      "contact_id": 12345,
      "contact_name": "John Doe",
      "deal_id": 98765,
      "deal_title": "Enterprise License Sale",
      "assigned_to": "user_67890",
      "assigned_to_name": "Sales Rep",
      "due_date": "2025-10-05",
      "created_at": "2025-10-03T03:00:00Z"
    }
  }
}
```

**Output:**
```json
{
  "event": "task.created",
  "timestamp": "2025-10-03T03:00:00Z",
  "task_id": 5555,
  "title": "Follow up with John Doe",
  "description": "Discuss pricing options",
  "type": "call",
  "contact_id": 12345,
  "contact_name": "John Doe",
  "deal_id": 98765,
  "deal_title": "Enterprise License Sale",
  "assigned_to": "user_67890",
  "assigned_to_name": "Sales Rep",
  "due_date": "2025-10-05",
  "created_at": "2025-10-03T03:00:00Z",
  "_raw": { /* original payload */ }
}
```

**Use Case:** Add task to Google Calendar, send notification to assigned user

---

### 14. Task Completed

**Event:** `task.completed`
**When:** Task marked as completed

**Input Payload:**
```json
{
  "event": "task.completed",
  "timestamp": "2025-10-03T04:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "task": {
      "id": 5555,
      "title": "Follow up with John Doe",
      "type": "call",
      "contact_id": 12345,
      "contact_name": "John Doe",
      "deal_id": 98765,
      "assigned_to": "user_67890",
      "assigned_to_name": "Sales Rep",
      "completed_at": "2025-10-03T04:00:00Z"
    }
  }
}
```

**Output:**
```json
{
  "event": "task.completed",
  "timestamp": "2025-10-03T04:00:00Z",
  "task_id": 5555,
  "title": "Follow up with John Doe",
  "type": "call",
  "contact_id": 12345,
  "contact_name": "John Doe",
  "deal_id": 98765,
  "assigned_to": "user_67890",
  "assigned_to_name": "Sales Rep",
  "completed_at": "2025-10-03T04:00:00Z",
  "_raw": { /* original payload */ }
}
```

**Use Case:** Log activity in reporting system, update deal progress

---

### 15. Task Due Soon

**Event:** `task.due_soon`
**When:** Task approaching due date (configured in Clientify)

**Input Payload:**
```json
{
  "event": "task.due_soon",
  "timestamp": "2025-10-03T05:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "task": {
      "id": 5556,
      "title": "Send proposal to Jane Smith",
      "type": "email",
      "contact_id": 12346,
      "contact_name": "Jane Smith",
      "assigned_to": "user_67890",
      "assigned_to_name": "Sales Rep",
      "due_date": "2025-10-04",
      "hours_until_due": 23
    }
  }
}
```

**Output:**
```json
{
  "event": "task.due_soon",
  "timestamp": "2025-10-03T05:00:00Z",
  "task_id": 5556,
  "title": "Send proposal to Jane Smith",
  "type": "email",
  "contact_id": 12346,
  "contact_name": "Jane Smith",
  "assigned_to": "user_67890",
  "assigned_to_name": "Sales Rep",
  "due_date": "2025-10-04",
  "hours_until_due": 23,
  "_raw": { /* original payload */ }
}
```

**Use Case:** Send reminder to assigned user

---

### 16. Task Overdue

**Event:** `task.overdue`
**When:** Task passed due date without completion

**Input Payload:**
```json
{
  "event": "task.overdue",
  "timestamp": "2025-10-03T06:00:00Z",
  "account_id": "acc_12345",
  "user_id": "user_67890",
  "data": {
    "task": {
      "id": 5557,
      "title": "Call prospect",
      "type": "call",
      "contact_id": 12347,
      "contact_name": "Bob Johnson",
      "assigned_to": "user_67891",
      "assigned_to_name": "Sales Rep 2",
      "due_date": "2025-10-02",
      "days_overdue": 1
    }
  }
}
```

**Output:**
```json
{
  "event": "task.overdue",
  "timestamp": "2025-10-03T06:00:00Z",
  "task_id": 5557,
  "title": "Call prospect",
  "type": "call",
  "contact_id": 12347,
  "contact_name": "Bob Johnson",
  "assigned_to": "user_67891",
  "assigned_to_name": "Sales Rep 2",
  "due_date": "2025-10-02",
  "days_overdue": 1,
  "_raw": { /* original payload */ }
}
```

**Use Case:** Send urgent notification to manager, escalate task

---

## Quick Reference Table

| # | Event | Type | Use Case |
|---|-------|------|----------|
| 1 | `contact.created` | Contact | Welcome email, create follow-up task |
| 2 | `contact.updated` | Contact | Sync to external CRM, log changes |
| 3 | `contact.deleted` | Contact | Archive data, remove from mailing lists |
| 4 | `company.created` | Company | Research company, assign account manager |
| 5 | `company.updated` | Company | Update external systems |
| 6 | `company.deleted` | Company | Clean up related data |
| 7 | `deal.created` | Deal | Notify sales team, create tasks |
| 8 | `deal.updated` | Deal | Track changes, update forecasts |
| 9 | `deal.won` | Deal | Send celebration, create invoice, onboard customer |
| 10 | `deal.lost` | Deal | Add to nurture campaign, analyze loss reason |
| 11 | `deal.stage_changed` | Deal | Stage-specific actions (pricing, contracts) |
| 12 | `deal.deleted` | Deal | Log deletion, archive data |
| 13 | `task.created` | Task | Add to calendar, notify assignee |
| 14 | `task.completed` | Task | Log activity, update metrics |
| 15 | `task.due_soon` | Task | Send reminder |
| 16 | `task.overdue` | Task | Escalate to manager |

---

## Common Workflow Patterns

### Pattern 1: Instant Notification
```
[Clientify Trigger: Deal Won] → [Slack: Post to #sales-wins]
```

### Pattern 2: Multi-Step Automation
```
[Clientify Trigger: Contact Created] → [Send Email] → [Create Task] → [Add to Mailchimp]
```

### Pattern 3: Conditional Logic
```
[Clientify Trigger: Deal Stage Changed] → [IF: stage = "Contract"] → [Generate PDF Contract]
```

### Pattern 4: Data Sync
```
[Clientify Trigger: Contact Updated] → [IF: email changed] → [HTTP: Update HubSpot]
```

---

## Setup Instructions

### 1. In n8n

1. Add "Clientify Trigger" node
2. Select event from dropdown
3. Choose Clientify MCP credentials
4. Save workflow
5. **Activate workflow** (toggle ON)
6. Click trigger node → Expand "Webhook URLs"
7. Switch to "Production URL" tab
8. **Copy the URL** (unique per workflow)

### 2. In Clientify

1. Go to Settings → Webhooks
2. Click "Add Webhook"
3. **Event:** Select matching event (e.g., "contact.created")
4. **URL:** Paste n8n webhook URL
5. **Status:** Active
6. Save

### 3. Test

Create a contact/deal/task in Clientify → Check n8n executions → Verify workflow ran!

---

## Important Notes

### Event Name Matching
- n8n event: "Contact Created" = `contact.created`
- Clientify must send: `"event": "contact.created"`
- **Case-sensitive!**

### Data Access in Workflows
```javascript
{{$json.first_name}}        // "John"
{{$json.email}}             // "john@example.com"
{{$json.value}}             // 50000 (for deals)
{{$json.changes.email.old}} // Previous email (for updates)
{{$json._raw}}              // Full original payload
```

### Webhook URL Requirements
- Unique per workflow
- Only works when workflow is ACTIVE
- Recreating workflow = new URL
- Must be publicly accessible (for production)

---

## Support

- **Issues:** https://github.com/contacteitor/clientify_n8n/issues
- **Email:** develop@clientify.com
- **Docs:** https://mcp.clientify.com/docs

---

**Last Updated:** 2025-10-02
**Package Version:** 0.2.0
**Status:** ✅ Production Ready
