import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class ClientifyApi implements ICredentialType {
	name = 'clientifyApi';
	displayName = 'Clientify API';
	documentationUrl = 'https://newapi.clientify.com/';
	authenticate: ICredentialType['authenticate'] = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Token {{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			// NOTE: n8n’s automated verification expects a literal baseURL here (not an expression).
			// Runtime requests still use the user-provided `baseUrl` credential value.
			baseURL: 'https://api-plus.clientify.com/v2',
			url: '/me/?fields=id,email',
			method: 'GET',
		},
	};
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'Enter your Clientify API key',
			description: 'Clientify API key (used as \"Authorization: Token &lt;apiKey&gt;\")',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api-plus.clientify.com/v2',
			placeholder: 'https://api-plus.clientify.com/v2',
			description: 'Optional override for the Clientify API base URL',
		},
	];
}
