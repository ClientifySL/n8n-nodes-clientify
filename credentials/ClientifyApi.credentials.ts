import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class ClientifyApi implements ICredentialType {
  name = "clientifyApi";
  displayName = "Clientify API";
  icon = {
    light: "file:clientify.svg",
    dark: "file:clientify.dark.svg",
  } as const;
  documentationUrl = "https://api-plus.clientify.com/api/docs/v2/scalar/";
  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Token {{$credentials.apiKey}}",
      },
    },
  };
  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.baseUrl}}",
      url: "/me/?fields=id,email",
      method: "GET",
    },
  };
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: {
        password: true,
      },
      default: "",
      required: true,
      placeholder: "Enter your Clientify API key",
      description:
        'Clientify API key (used as "Authorization: Token &lt;apiKey&gt;")',
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://api-plus.clientify.com/v2",
      placeholder: "https://api-plus.clientify.com/v2",
      description: "Optional override for the Clientify API base URL",
    },
  ];
}
