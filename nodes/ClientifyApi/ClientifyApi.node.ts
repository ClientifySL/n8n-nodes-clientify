import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

import { ClientifyClient } from '@clientify/api-client';

import {
	operationDefinitions,
	operationOptions,
	operationFields,
	omitKeys,
	renderPathTemplate,
} from './ClientifyApiCatalog';

export class ClientifyApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clientify',
		name: 'clientifyApi',
		icon: 'file:clientify.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Clientify CRM (direct API via @clientify/api-client)',
		defaults: {
			name: 'Clientify',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'clientifyApi',
				required: true,
			},
		],
		properties: (() => {
			const props: INodeProperties[] = [
				{
					displayName: 'Action',
					name: 'operation',
					type: 'options',
					options: operationOptions,
					default: 'GetCurrentUser',
					required: true,
					noDataExpression: true,
					description: 'Select the Clientify action to execute (mirrors the AppMixer connector action list)',
				},
				...operationFields,
			];
			return props;
		})(),
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('clientifyApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = (credentials.baseUrl as string) || 'https://api-plus.clientify.com/v2';

		const client = new ClientifyClient({ apiKey, baseUrl });
		const http = client.getHttpClient();

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;
			const def = operationDefinitions[operation];

			if (!def) {
				throw new NodeOperationError(
					this.getNode(),
					`Unknown operation "${operation}". Ensure the AppMixer CRM catalog is present in this node package build output.`
				);
			}

			try {
				const input: Record<string, unknown> = {};

				for (const fieldName of def.fieldNames) {
					let value: unknown;
					try {
						value = this.getNodeParameter(fieldName, itemIndex);
					} catch {
						continue;
					}

					// Apply per-operation defaults if user left the field empty.
					if ((value === '' || value === null || value === undefined) && fieldName in def.fieldDefaults) {
						value = def.fieldDefaults[fieldName];
					}

					// Avoid accidentally sending empty optional values (n8n defaults).
					const isRequired = def.requiredFieldNames.includes(fieldName);
					if (!isRequired) {
						if (value === '' || value === null || value === undefined) continue;
						if (typeof value === 'number' && value === 0) continue;
						if (typeof value === 'boolean' && value === false) continue;
					}

					input[fieldName] = value;
				}

				// Validate required fields are present (avoid confusing API errors).
				for (const fieldName of def.requiredFieldNames) {
					const value = input[fieldName];
					if (value === undefined || value === null || value === '') {
						throw new NodeOperationError(this.getNode(), `${fieldName} is required`);
					}
					if (typeof value === 'number' && value <= 0) {
						throw new NodeOperationError(this.getNode(), `${fieldName} must be a positive number`);
					}
				}

				const url = renderPathTemplate(def.pathTemplate, input);
				const rest = omitKeys(input, def.pathParamNames);

				const isQueryMethod = def.method === 'GET' || def.method === 'DELETE';
				const params = isQueryMethod ? { ...def.fixedQuery, ...rest } : undefined;
				const data = !isQueryMethod && Object.keys(rest).length > 0 ? rest : undefined;

				const result = await http.request({
					method: def.method,
					url,
					params,
					data,
				});

				const normalized =
					result === undefined || result === null || result === ''
						? { ok: true }
						: typeof result === 'object'
							? result
							: { data: result };

				returnData.push({
					json: {
						...normalized,
						_meta: {
							operation,
							method: def.method,
							path: url,
						},
					},
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							operation,
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
