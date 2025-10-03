import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ClientifyMcpApi implements ICredentialType {
  name = 'clientifyMcpApi';
  displayName = 'Clientify MCP API';
  documentationUrl = 'https://mcp.clientify.com/docs';
  properties: INodeProperties[] = [
    {
      displayName: 'Authentication Token',
      name: 'authToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      placeholder: 'Enter your JWT token',
      description: 'The x-end-user-token for authentication with Clientify MCP server',
    },
  ];
}