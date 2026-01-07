import {
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';

export class ClientifyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clientify Trigger',
		name: 'clientifyTrigger',
		icon: 'file:clientify.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts workflow when a Clientify webhook payload is received',
		defaults: {
			name: 'Clientify Trigger',
		},
		inputs: [],
		outputs: ['main'],
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
				default: 'contact.created',
				description: 'The Clientify event that will trigger this workflow',
				options: [
					// Company Events
					{
						name: 'Company Created',
						value: 'company.created',
						description: 'Triggers when a new company is created in Clientify',
					},
					{
						name: 'Company Deleted',
						value: 'company.deleted',
						description: 'Triggers when a company is deleted from Clientify',
					},
					{
						name: 'Company Updated',
						value: 'company.updated',
						description: 'Triggers when a company is updated in Clientify',
					},
					// Contact Events
					{
						name: 'Contact Created',
						value: 'contact.created',
						description: 'Triggers when a new contact is created in Clientify',
					},
					{
						name: 'Contact Deleted',
						value: 'contact.deleted',
						description: 'Triggers when a contact is deleted from Clientify',
					},
					{
						name: 'Contact Updated',
						value: 'contact.updated',
						description: 'Triggers when a contact is updated in Clientify',
					},
					// Deal Events
					{
						name: 'Deal Created',
						value: 'deal.created',
						description: 'Triggers when a new deal is created in Clientify',
					},
					{
						name: 'Deal Deleted',
						value: 'deal.deleted',
						description: 'Triggers when a deal is deleted from Clientify',
					},
					{
						name: 'Deal Lost',
						value: 'deal.lost',
						description: 'Triggers when a deal is marked as lost',
					},
					{
						name: 'Deal Stage Changed',
						value: 'deal.stage_changed',
						description: 'Triggers when a deal moves to a different stage',
					},
					{
						name: 'Deal Updated',
						value: 'deal.updated',
						description: 'Triggers when a deal is updated in Clientify',
					},
					{
						name: 'Deal Won',
						value: 'deal.won',
						description: 'Triggers when a deal is marked as won',
					},
					// Task Events
					{
						name: 'Task Completed',
						value: 'task.completed',
						description: 'Triggers when a task is marked as completed',
					},
					{
						name: 'Task Created',
						value: 'task.created',
						description: 'Triggers when a new task is created in Clientify',
					},
					{
						name: 'Task Due Soon',
						value: 'task.due_soon',
						description: 'Triggers when a task is approaching its due date',
					},
					{
						name: 'Task Overdue',
						value: 'task.overdue',
						description: 'Triggers when a task is overdue',
					},
				],
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const event = this.getNodeParameter('event') as string;

		// Get webhook payload from request body
		const payload = req.body as any;

		// Validate that we received a payload
		if (!payload || typeof payload !== 'object') {
			return {
				workflowData: [],
			};
		}

		// Validate that the event matches what user configured
		// If events don't match, don't trigger the workflow
		if (payload.event !== event) {
			return {
				workflowData: [],
			};
		}

		// Extract and flatten data based on event type for easier access in workflows
		let workflowData: any = {
			event: payload.event,
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
		if (payload.event.startsWith('contact.')) {
			// Contact events
			if (payload.data?.contact) {
				workflowData = {
					...workflowData,
					contact_id: payload.data.contact.id,
					...payload.data.contact,
				};
			}
			// Include changes for update events
			if (payload.data?.changes) {
				workflowData.changes = payload.data.changes;
			}
		} else if (payload.event.startsWith('company.')) {
			// Company events
			if (payload.data?.company) {
				workflowData = {
					...workflowData,
					company_id: payload.data.company.id,
					...payload.data.company,
				};
			}
			// Include changes for update events
			if (payload.data?.changes) {
				workflowData.changes = payload.data.changes;
			}
		} else if (payload.event.startsWith('deal.')) {
			// Deal events
			if (payload.data?.deal) {
				workflowData = {
					...workflowData,
					deal_id: payload.data.deal.id,
					...payload.data.deal,
				};
			}
			// Include changes for update events
			if (payload.data?.changes) {
				workflowData.changes = payload.data.changes;
			}
		} else if (payload.event.startsWith('task.')) {
			// Task events
			if (payload.data?.task) {
				workflowData = {
					...workflowData,
					task_id: payload.data.task.id,
					...payload.data.task,
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
