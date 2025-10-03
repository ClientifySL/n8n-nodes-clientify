const https = require('https');
const fs = require('fs');
const path = require('path');

// MCP Configuration
const MCP_URL = 'https://mcp.clientify.com/mcp';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkdES2VkVXo5czg2bGU4TW8iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FmaHJzenRvZGZwY3FiZG1jamZnLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiODA2YTVkMC1mYzBjLTRiNTgtYWE0My0zMmRkMWI1OWI2MWUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3NzE3NzIwLCJpYXQiOjE3NTcxMTI5MjAsImVtYWlsIjoic2ViYXN0aWFuQHNlYmFzdGlhbm1hY2lhcy5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTZWJhc3RpYW4gTWFjaWFzIiwibGFzdF9uYW1lIjoiTWFjaWFzIiwibmFtZSI6IlNlYmFzdGlhbiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im90cCIsInRpbWVzdGFtcCI6MTc1MjM2OTIzM31dLCJzZXNzaW9uX2lkIjoiNzZlYTEyNzItMzQ5Zi00ZjUwLThiNDgtYjc2MDZiMTQ0ZTQyIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.0rXl43au430UfL7Jp95lsIzePsaP0Sfg10nHSUW98t8';

let sessionId = null;

function makeRequest(body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mcp.clientify.com',
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-end-user-token': AUTH_TOKEN,
      }
    };
    
    if (sessionId) {
      options.headers['Mcp-Session-Id'] = sessionId;
    }

    const req = https.request(options, (res) => {
      let data = '';
      
      // Capture session ID from headers
      if (res.headers['mcp-session-id'] || res.headers['Mcp-Session-Id']) {
        sessionId = res.headers['mcp-session-id'] || res.headers['Mcp-Session-Id'];
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function initializeSession() {
  console.log('Initializing MCP session...');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {}
    }
  };
  
  const response = await makeRequest(initRequest);
  console.log('Session initialized:', sessionId);
  return response;
}

async function listTools() {
  console.log('Fetching tools list...');
  const listRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  };
  
  const response = await makeRequest(listRequest);
  return response.result.tools || [];
}

async function getToolSchema(toolName) {
  console.log(`Fetching schema for ${toolName}...`);
  const schemaRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'describe',
      arguments: {
        tool: toolName
      }
    }
  };
  
  const response = await makeRequest(schemaRequest);
  
  // Parse the text content to extract schema
  if (response.result && response.result.content && response.result.content[0]) {
    const text = response.result.content[0].text;
    try {
      // Extract JSON from the text
      const schemaMatch = text.match(/schema:\s*({[\s\S]*?})\s*arguments:/);
      if (schemaMatch) {
        return JSON.parse(schemaMatch[1]);
      }
      
      // Try to find properties in the text
      const propsMatch = text.match(/properties:\s*({[\s\S]*?})\s*type:/);
      if (propsMatch) {
        return { properties: JSON.parse(propsMatch[1]) };
      }
    } catch (e) {
      console.log(`Could not parse schema for ${toolName}:`, e.message);
    }
  }
  
  return null;
}

function convertSchemaToN8nField(propName, propSchema, required = false) {
  const field = {
    displayName: propName.replace(/([A-Z])/g, ' $1').trim()
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' '),
    name: propName,
    type: 'string',
    default: '',
    required: required,
    description: propSchema.description || ''
  };
  
  // Map JSON schema types to n8n types
  if (propSchema.type === 'integer' || propSchema.type === 'number') {
    field.type = 'number';
    field.default = propSchema.default || 0;
  } else if (propSchema.type === 'boolean') {
    field.type = 'boolean';
    field.default = propSchema.default || false;
  } else if (propSchema.enum) {
    field.type = 'options';
    field.options = propSchema.enum.map(value => ({
      name: String(value).replace(/([A-Z])/g, ' $1').trim(),
      value: value
    }));
    field.default = propSchema.default || propSchema.enum[0] || '';
  } else if (propSchema.format === 'date' || propSchema.format === 'date-time') {
    field.type = 'dateTime';
    field.default = '';
  }
  
  return field;
}

function generateToolFields(toolName, schema) {
  const fields = [];
  const additionalFields = [];
  
  if (!schema || !schema.properties) {
    return { fields, additionalFields };
  }
  
  const required = schema.required || [];
  
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const isRequired = required.includes(propName);
    const field = convertSchemaToN8nField(propName, propSchema, isRequired);
    
    // Add displayOptions to show only for this tool
    field.displayOptions = {
      show: {
        tool: [toolName]
      }
    };
    
    if (isRequired) {
      fields.push(field);
    } else {
      // Remove displayOptions for additional fields (they'll be wrapped)
      delete field.displayOptions;
      additionalFields.push(field);
    }
  }
  
  return { fields, additionalFields };
}

async function generateFieldDefinitions() {
  try {
    // Initialize session
    await initializeSession();
    
    // Get all tools
    const tools = await listTools();
    console.log(`Found ${tools.length} tools`);
    
    const toolDefinitions = {};
    const allFields = [];
    const additionalFieldsByTool = {};
    
    // Process each tool
    for (const tool of tools) {
      console.log(`Processing ${tool.name}...`);
      
      // Skip certain meta tools
      if (['describe', 'info'].includes(tool.name)) {
        continue;
      }
      
      // For now, we'll parse the description to extract parameters
      // In a real implementation, we'd call describe for each tool
      const paramMatch = tool.description?.match(/PARAMETERS:[\s\S]*?(?=EXAMPLE:|$)/);
      
      if (paramMatch) {
        // Parse parameters from description
        const schema = { properties: {}, required: [] };
        
        // Extract required parameters
        const requiredMatch = paramMatch[0].match(/• Required:([\s\S]*?)(?=• Optional:|EXAMPLE:|$)/);
        if (requiredMatch) {
          const params = requiredMatch[1].match(/- (\w+)\s*\((\w+)\)/g);
          if (params) {
            params.forEach(param => {
              const match = param.match(/- (\w+)\s*\((\w+)\)/);
              if (match) {
                const [, name, type] = match;
                schema.properties[name] = { type };
                schema.required.push(name);
              }
            });
          }
        }
        
        // Extract optional parameters
        const optionalMatch = paramMatch[0].match(/• Optional:([\s\S]*?)(?=EXAMPLE:|$)/);
        if (optionalMatch) {
          const params = optionalMatch[1].match(/- (\w+)\s*\((\w+)\)/g);
          if (params) {
            params.forEach(param => {
              const match = param.match(/- (\w+)\s*\((\w+)\)/);
              if (match) {
                const [, name, type] = match;
                schema.properties[name] = { type };
              }
            });
          }
        }
        
        const { fields, additionalFields } = generateToolFields(tool.name, schema);
        
        // Add required fields directly
        allFields.push(...fields);
        
        // Store additional fields for this tool
        if (additionalFields.length > 0) {
          additionalFieldsByTool[tool.name] = additionalFields;
        }
      }
      
      toolDefinitions[tool.name] = tool;
    }
    
    // Generate TypeScript code
    const tsCode = generateTypeScriptCode(toolDefinitions, allFields, additionalFieldsByTool);
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'nodes', 'ClientifyMcp', 'ClientifyMcpFields.ts');
    fs.writeFileSync(outputPath, tsCode);
    
    console.log(`Generated field definitions at ${outputPath}`);
    console.log(`Total tools processed: ${Object.keys(toolDefinitions).length}`);
    console.log(`Total fields generated: ${allFields.length}`);
    
  } catch (error) {
    console.error('Error generating field definitions:', error);
    process.exit(1);
  }
}

function generateTypeScriptCode(tools, fields, additionalFieldsByTool) {
  let code = `// This file is auto-generated. Do not edit manually.
// Generated on ${new Date().toISOString()}

import { INodeProperties } from 'n8n-workflow';

export const toolOptions = [
${Object.entries(tools).map(([name, tool]) => `  {
    name: '${tool.name.replace(/([A-Z])/g, ' $1').trim()}',
    value: '${tool.name}',
    description: '${(tool.description || '').split('\n')[0].replace(/'/g, "\\'").replace(/\n/g, ' ')}'
  }`).join(',\n')}
];

export const toolFields: INodeProperties[] = [
${fields.map(field => `  ${JSON.stringify(field, null, 2).replace(/\n/g, '\n  ')}`).join(',\n')}
];

export const additionalFieldsDefinitions: { [key: string]: INodeProperties[] } = {
${Object.entries(additionalFieldsByTool).map(([toolName, fields]) => `  '${toolName}': [
${fields.map(field => `    ${JSON.stringify(field, null, 2).replace(/\n/g, '\n    ')}`).join(',\n')}
  ]`).join(',\n')}
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
`;
  
  return code;
}

// Run the script
generateFieldDefinitions();