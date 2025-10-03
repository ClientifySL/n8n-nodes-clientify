import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestMethods,
  INodeProperties,
  NodeOperationError,
  NodeConnectionType,
} from 'n8n-workflow';

import { toolOptions, toolFields, getAdditionalFieldsForTool } from './ClientifyMcpFields';

export class ClientifyMcpDynamic implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Clientify',
    name: 'clientifyMcpDynamic',
    icon: 'file:clientify.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["tool"]}}',
    description: 'Connect to Clientify CRM via MCP',
    defaults: {
      name: 'Clientify',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'clientifyMcpApi',
        required: true,
      },
    ],
    properties: (() => {
      const props: INodeProperties[] = [
        {
          displayName: 'Tool',
          name: 'tool',
          type: 'options',
          options: toolOptions,
          default: 'listContacts',
          required: true,
          description: 'Select the MCP tool to execute',
        },
        ...toolFields,
      ];
      
      // Add additional fields for each tool
      for (const toolOption of toolOptions) {
        const additionalField = getAdditionalFieldsForTool(toolOption.value as string);
        if (additionalField) {
          props.push(additionalField);
        }
      }
      
      return props;
    })(),
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    // Get credentials
    const credentials = await this.getCredentials('clientifyMcpApi');
    const authToken = credentials.authToken as string;
    
    // MCP Server URL is fixed
    const mcpUrl = 'https://mcp.clientify.com/mcp';
    
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const toolName = this.getNodeParameter('tool', itemIndex) as string;
        
        // Build tool arguments from individual fields
        const toolArguments: Record<string, unknown> = {};

        // Process regular fields
        for (const field of toolFields) {
          const fieldName = field.name;
          // Check if this field should be shown for the current tool
          if (field.displayOptions?.show?.tool?.includes(toolName)) {
            try {
              const value = this.getNodeParameter(fieldName, itemIndex);
              if (value !== undefined && value !== '' && value !== null) {
                toolArguments[fieldName] = value;
              }
            } catch (e) {
              // Field might not exist for this tool
            }
          }
        }
        
        // Process additional fields
        const additionalFieldsParam = `additionalFields`;
        try {
          const additionalFields = this.getNodeParameter(additionalFieldsParam, itemIndex) as Record<string, unknown>;
          if (additionalFields && typeof additionalFields === 'object') {
            Object.assign(toolArguments, additionalFields);
          }
        } catch (e) {
          // Additional fields might not exist for this tool
        }
        
        // Step 1: Initialize session
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {}
          }
        };
        
        const initOptions = {
          method: 'POST' as IHttpRequestMethods,
          url: mcpUrl,
          headers: {
            'Content-Type': 'application/json',
            'x-end-user-token': authToken,
          },
          body: initRequest,
          json: true,
          returnFullResponse: true,
        };
        
        const initResponse = await this.helpers.httpRequest(initOptions);
        
        // Extract session ID from headers
        const sessionId = initResponse.headers['mcp-session-id'] || initResponse.headers['Mcp-Session-Id'];

        if (!sessionId) {
          throw new NodeOperationError(this.getNode(), 'Failed to get session ID from MCP server');
        }

        // Step 2: Execute the selected tool
        const requestBody: Record<string, unknown> = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: toolArguments,
          }
        };
        
        // Make request with session ID
        const options = {
          method: 'POST' as IHttpRequestMethods,
          url: mcpUrl,
          headers: {
            'Content-Type': 'application/json',
            'x-end-user-token': authToken,
            'Mcp-Session-Id': sessionId,
          },
          body: requestBody,
          json: true,
        };
        
        const response = await this.helpers.httpRequest(options);

        // Process response
        if (response.error) {
          throw new NodeOperationError(this.getNode(), `MCP Error: ${response.error.message || JSON.stringify(response.error)}`);
        }

        // Parse MCP response to make it user-friendly
        let parsedResult: Record<string, unknown> = {};
        
        try {
          // Check if response has the MCP structure with JSON string
          if (response.result?.content?.[0]?.text) {
            // Parse the JSON string from MCP response
            const mcpData = JSON.parse(response.result.content[0].text);
            
            // Return the parsed data directly - clean and accessible
            parsedResult = mcpData;
            
            // Add helpful boolean flags for common checks (generic, works for any response)
            if (typeof mcpData === 'object' && mcpData !== null) {
              // If there's a count field, add a boolean for it
              if ('count' in mcpData) {
                parsedResult._hasResults = mcpData.count > 0;
              }
              // If there's a results array, add a boolean for it
              if (Array.isArray(mcpData.results)) {
                parsedResult._hasResults = mcpData.results.length > 0;
                parsedResult._resultCount = mcpData.results.length;
              }
              // If there's a success field, expose it clearly
              if ('success' in mcpData) {
                parsedResult._success = mcpData.success;
              }
              // If there's an error field, expose it clearly
              if ('error' in mcpData) {
                parsedResult._hasError = true;
                parsedResult._error = mcpData.error;
              }
            }
          } else {
            // Not an MCP text response - return as is
            parsedResult = response.result || response;
          }
        } catch (parseError) {
          // If parsing fails, return original result
          parsedResult = response.result || response;
        }
        
        // Return formatted result with both parsed and raw data
        returnData.push({
          json: {
            success: true,
            tool: toolName,
            sessionId: sessionId,
            // User-friendly parsed data at root level
            ...parsedResult,
            // Keep raw response for advanced users
            _raw: response.result || response,
          },
          pairedItem: itemIndex,
        });
        
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            },
            pairedItem: itemIndex,
          });
          continue;
        }
        throw error;
      }
    }
    
    return [returnData];
  }
}