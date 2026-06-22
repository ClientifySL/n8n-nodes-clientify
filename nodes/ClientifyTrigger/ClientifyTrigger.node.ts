import {
	IDataObject,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeConnectionTypes,
} from 'n8n-workflow';

type ClientifyWebhookPayload = {
	event?: string;
	hook?: {
		event?: string;
		[key: string]: unknown;
	};
	timestamp?: string | number;
	account_id?: string | number;
	user_id?: string | number;
	data?: {
		contact?: IDataObject;
		company?: IDataObject;
		deal?: IDataObject;
		task?: IDataObject;
		changes?: IDataObject;
	};
	[key: string]: unknown;
};

function getPayloadEvent(payload: ClientifyWebhookPayload): string | undefined {
	return payload.event || payload.hook?.event;
}

function getPayloadEntity(payload: ClientifyWebhookPayload, entity: string): IDataObject | undefined {
	const fromData = payload.data?.[entity as keyof NonNullable<ClientifyWebhookPayload['data']>];
	if (fromData && typeof fromData === 'object') {
		return fromData;
	}

	const fromRoot = payload[entity];
	if (fromRoot && typeof fromRoot === 'object') {
		return fromRoot as IDataObject;
	}

	return undefined;
}

export class ClientifyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clientify Trigger',
		name: 'clientifyTrigger',
		usableAsTool: true,
		icon: 'file:clientify.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts workflow when a Clientify webhook payload is received',
		defaults: {
			name: 'Clientify Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'contact.saved',
				description: 'The Clientify event that will trigger this workflow',
				options: [
					// Clientify sends saved events for create and update operations.
					{
						name: 'Company Deleted',
						value: 'company.deleted',
						description: 'Triggers when a company is deleted from Clientify',
					},
					{
						name: 'Company Saved',
						value: 'company.saved',
						description: 'Triggers when a company is created or updated in Clientify',
					},
					{
						name: 'Contact Saved',
						value: 'contact.saved',
						description: 'Triggers when a contact is created or updated in Clientify',
					},
					{
						name: 'Deal Saved',
						value: 'deal.saved',
						description: 'Triggers when a deal is created, updated, won, lost, or moved in Clientify',
					},
					{
						name: 'Task Saved',
						value: 'task.saved',
						description: 'Triggers when a task is created or updated in Clientify',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const event = this.getNodeParameter('event') as string;

		// Get webhook payload from request body
		const payload = req.body as ClientifyWebhookPayload;

		// Validate that we received a payload
		if (!payload || typeof payload !== 'object') {
			return {
				workflowData: [],
			};
		}

		const payloadEvent = getPayloadEvent(payload);

		// Validate that the event matches what user configured
		// If events don't match, don't trigger the workflow
		if (payloadEvent !== event) {
			return {
				workflowData: [],
			};
		}

		// Extract and flatten data based on event type for easier access in workflows
		let workflowData: IDataObject = {
			event: payloadEvent,
			timestamp: payload.timestamp,
		};

		// Add account and user info if present
		if (payload.account_id) {
			workflowData.account_id = payload.account_id;
		}
		if (payload.user_id) {
			workflowData.user_id = payload.user_id;
		}

		// Flatten the nested data structure based on event type
		if (payloadEvent.startsWith('contact.')) {
			// Contact events
			const contact = getPayloadEntity(payload, 'contact');
			if (contact) {
				workflowData = {
					...workflowData,
					contact_id: contact.id,
					...contact,
				};
			}
			// Include changes for update events
			if (payload.data?.changes) {
				workflowData.changes = payload.data.changes;
			}
		} else if (payloadEvent.startsWith('company.')) {
			// Company events
			const company = getPayloadEntity(payload, 'company');
			if (company) {
				workflowData = {
					...workflowData,
					company_id: company.id,
					...company,
				};
			}
			// Include changes for update events
			if (payload.data?.changes) {
				workflowData.changes = payload.data.changes;
			}
		} else if (payloadEvent.startsWith('deal.')) {
			// Deal events
			const deal = getPayloadEntity(payload, 'deal');
			if (deal) {
				workflowData = {
					...workflowData,
					deal_id: deal.id,
					...deal,
				};
			}
			// Include changes for update events
			if (payload.data?.changes) {
				workflowData.changes = payload.data.changes;
			}
		} else if (payloadEvent.startsWith('task.')) {
			// Task events
			const task = getPayloadEntity(payload, 'task');
			if (task) {
				workflowData = {
					...workflowData,
					task_id: task.id,
					...task,
				};
			}
		}

		// Keep the original raw payload for advanced users who need it
		workflowData._raw = payload;

		// Return the data that will be passed to the workflow
		return {
			workflowData: [
				[
					{
						json: workflowData,
					},
				],
			],
		};
	}
}
