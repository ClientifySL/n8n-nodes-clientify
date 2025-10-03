// This file is auto-generated. Do not edit manually.
// Generated on 2025-09-28T22:48:12.168Z

import { INodeProperties } from 'n8n-workflow';

export const toolOptions = [
  {
    name: 'Create Company',
    value: 'createCompany',
    description: 'Create a new company in the CRM'
  },
  {
    name: 'Create Contact',
    value: 'createContact',
    description: 'Create a new contact in the CRM'
  },
  {
    name: 'Create Deal',
    value: 'createDeal',
    description: 'Create a new deal/opportunity in the CRM'
  },
  {
    name: 'Create Task',
    value: 'createTask',
    description: 'Create a new task/activity in the CRM'
  },
  {
    name: 'Delete Company',
    value: 'deleteCompany',
 },
  {
    name: 'Delete Contact',
    value: 'deleteContact',
 },
  {
    name: 'Delete Deal',
    value: 'deleteDeal',
 },
  {
    name: 'Get Company',
    value: 'getCompany',
    description: 'Retrieve detailed information about a specific company by ID'
  },
  {
    name: 'Get Contact',
    value: 'getContact',
    description: 'Retrieve detailed information about a specific contact by ID'
  },
  {
    name: 'Get Current Time',
    value: 'getCurrentTime',
    description: 'Returns the current date and time with user timezone awareness and relative dates'
  },
  {
    name: 'Get Current User',
    value: 'getCurrentUser',
 },
  {
    name: 'Get Deal',
    value: 'getDeal',
    description: 'Retrieve detailed information about a specific deal by ID'
  },
  {
    name: 'Get Task',
    value: 'getTask',
    description: 'Retrieve detailed information about a specific task by ID'
  },
  {
    name: 'List Activity Types',
    value: 'listActivityTypes',
 },
  {
    name: 'List Companies',
    value: 'listCompanies',
    description: 'List all companies with pagination. Use this when you want to see all companies.'
  },
  {
    name: 'List Contacts',
    value: 'listContacts',
    description: 'List all contacts or search for specific contacts'
  },
  {
    name: 'List Deals',
    value: 'listDeals',
    description: 'List all deals with filtering and pagination support'
  },
  {
    name: 'List Deals By Stage',
    value: 'listDealsByStage',
 },
  {
    name: 'List Pipelines',
    value: 'listPipelines',
 },
  {
    name: 'List Tasks',
    value: 'listTasks',
    description: 'List tasks with automatic optimization to prevent timeouts'
  },
  {
    name: 'Mark Deal Lost',
    value: 'markDealLost',
    description: 'Mark deal as lost'
  },
  {
    name: 'Mark Deal Won',
    value: 'markDealWon',
    description: 'Mark deal as won'
  },
  {
    name: 'Search Companies',
    value: 'searchCompanies',
    description: 'Search for specific companies by name. Returns companies matching the search query.'
  },
  {
    name: 'Update Company',
    value: 'updateCompany',
 },
  {
    name: 'Update Contact',
    value: 'updateContact',
 },
  {
    name: 'Update Deal',
    value: 'updateDeal',
 }
];

export const toolFields: INodeProperties[] = [
  {
    "displayName": "Name",
    "name": "name",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createCompany"
        ]
      }
    }
  },
  {
    "displayName": "Last name",
    "name": "last_name",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createContact"
        ]
      }
    }
  },
  {
    "displayName": "First name",
    "name": "first_name",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createContact"
        ]
      }
    }
  },
  {
    "displayName": "Name",
    "name": "name",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createDeal"
        ]
      }
    }
  },
  {
    "displayName": "Company",
    "name": "company",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createDeal"
        ]
      }
    }
  },
  {
    "displayName": "Priority",
    "name": "priority",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createTask"
        ]
      }
    }
  },
  {
    "displayName": "Name",
    "name": "name",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "createTask"
        ]
      }
    }
  },
  {
    "displayName": "Company Id",
    "name": "companyId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "deleteCompany"
        ]
      }
    }
  },
  {
    "displayName": "Contact Id",
    "name": "contactId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "deleteContact"
        ]
      }
    }
  },
  {
    "displayName": "Deal Id",
    "name": "dealId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "deleteDeal"
        ]
      }
    }
  },
  {
    "displayName": "Company Id",
    "name": "companyId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "getCompany"
        ]
      }
    }
  },
  {
    "displayName": "Contact Id",
    "name": "contactId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "getContact"
        ]
      }
    }
  },
  {
    "displayName": "Deal Id",
    "name": "dealId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "getDeal"
        ]
      }
    }
  },
  {
    "displayName": "Task Id",
    "name": "taskId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "getTask"
        ]
      }
    }
  },
  {
    "displayName": "Deal Id",
    "name": "dealId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "markDealLost"
        ]
      }
    }
  },
  {
    "displayName": "Deal Id",
    "name": "dealId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "markDealWon"
        ]
      }
    }
  },
  {
    "displayName": "Query",
    "name": "query",
    "type": "string",
    "default": "",
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "searchCompanies"
        ]
      }
    }
  },
  {
    "displayName": "Company Id",
    "name": "companyId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "updateCompany"
        ]
      }
    }
  },
  {
    "displayName": "Contact Id",
    "name": "contactId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "updateContact"
        ]
      }
    }
  },
  {
    "displayName": "Deal Id",
    "name": "dealId",
    "type": "number",
    "default": 0,
    "required": true,
    "description": "",
    "displayOptions": {
      "show": {
        "tool": [
          "updateDeal"
        ]
      }
    }
  }
];

export const additionalFieldsDefinitions: { [key: string]: INodeProperties[] } = {
  'createContact': [
    {
      "displayName": "Company id",
      "name": "company_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Email",
      "name": "email",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Phone",
      "name": "phone",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    }
  ],
  'createDeal': [
    {
      "displayName": "Contact",
      "name": "contact",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Stage id",
      "name": "stage_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Amount",
      "name": "amount",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ],
  'createTask': [
    {
      "displayName": "Related companies",
      "name": "related_companies",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Activity type",
      "name": "activity_type",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Description",
      "name": "description",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Due date",
      "name": "due_date",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    }
  ],
  'getCurrentTime': [
    {
      "displayName": "Timezone",
      "name": "timezone",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    }
  ],
  'listCompanies': [
    {
      "displayName": "Page",
      "name": "page",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Page size",
      "name": "page_size",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ],
  'listContacts': [
    {
      "displayName": "Page size",
      "name": "page_size",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Search",
      "name": "search",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Modified after",
      "name": "modified_after",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Owner id",
      "name": "owner_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Company id",
      "name": "company_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Page",
      "name": "page",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Created after",
      "name": "created_after",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Created before",
      "name": "created_before",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Status id",
      "name": "status_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Order by",
      "name": "order_by",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    }
  ],
  'listDeals': [
    {
      "displayName": "Expected close before",
      "name": "expected_close_before",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Created after",
      "name": "created_after",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Page",
      "name": "page",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Page size",
      "name": "page_size",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Search",
      "name": "search",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Pipeline id",
      "name": "pipeline_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Stage id",
      "name": "stage_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Owner id",
      "name": "owner_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Expected close after",
      "name": "expected_close_after",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Order by",
      "name": "order_by",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Status",
      "name": "status",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Company id",
      "name": "company_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Min amount",
      "name": "min_amount",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Max amount",
      "name": "max_amount",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ],
  'listDealsByStage': [
    {
      "displayName": "Pipeline id",
      "name": "pipeline_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ],
  'listTasks': [
    {
      "displayName": "Company",
      "name": "company",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ],
  'searchCompanies': [
    {
      "displayName": "Broad search",
      "name": "broad_search",
      "type": "boolean",
      "default": false,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Page",
      "name": "page",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Page size",
      "name": "page_size",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ],
  'updateCompany': [
    {
      "displayName": "Name",
      "name": "name",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Description",
      "name": "description",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    }
  ],
  'updateContact': [
    {
      "displayName": "Phone",
      "name": "phone",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Company id",
      "name": "company_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Email",
      "name": "email",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "First name",
      "name": "first_name",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Last name",
      "name": "last_name",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    }
  ],
  'updateDeal': [
    {
      "displayName": "Amount",
      "name": "amount",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    },
    {
      "displayName": "Name",
      "name": "name",
      "type": "string",
      "default": "",
      "required": false,
      "description": ""
    },
    {
      "displayName": "Stage id",
      "name": "stage_id",
      "type": "number",
      "default": 0,
      "required": false,
      "description": ""
    }
  ]
};

// Helper function to get additional fields for a tool
export function getAdditionalFieldsForTool(toolName: string): INodeProperties | null {
  const fields = additionalFieldsDefinitions[toolName] || [];
  
  if (fields.length === 0) {
    return null;
  }
  
  return {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        tool: [toolName]
      }
    },
    options: fields
  };
}
