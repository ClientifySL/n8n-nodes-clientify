import { randomBytes } from 'crypto';

import {
	IDataObject,
	IHookFunctions,
	IHttpRequestMethods,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Clientify exposes six fixed webhooks, one per CRM entity: no more can be
 * created and one entity cannot have two addresses. Each slot always covers
 * both events of its entity (saved and deleted), so the prefix of the chosen
 * event determines which slot to register.
 */
const EVENT_PREFIX_TO_ENTITY: Record<string, string> = {
	budget: 'budgets',
	company: 'companies',
	contact: 'contacts',
	deal: 'deals',
	product: 'products',
	task: 'tasks',
};

/** Header carrying the shared secret set when the webhook is registered. */
const SECRET_HEADER_NAME = 'X-Clientify-Secret';

const DEFAULT_BASE_URL = 'https://api-plus.clientify.com/v2';

type ClientifyWebhook = {
	entity?: string;
	target?: string;
	is_active?: boolean;
	events?: string[];
};

type ClientifyWebhookPayload = {
	event?: string;
	hook?: {
		id?: number | string;
		event?: string;
		target?: string;
		[key: string]: unknown;
	};
	timestamp?: string | number;
	account_id?: string | number;
	user_id?: string | number;
	data?: IDataObject;
	[key: string]: unknown;
};

type ClientifyApiResponse = {
	statusCode: number;
	body: IDataObject;
};

/** Calls the Clientify v2 API without throwing on the status code. */
async function clientifyApiRequest(
	this: IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<ClientifyApiResponse> {
	const credentials = await this.getCredentials('clientifyApi');
	const baseUrl = ((credentials.baseUrl as string) || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');

	const response = await this.helpers.httpRequestWithAuthentication.call(this, 'clientifyApi', {
		method,
		url: `${baseUrl}${path}`,
		body,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	});

	return {
		statusCode: response.statusCode as number,
		body: (response.body ?? {}) as IDataObject,
	};
}

/** Compares addresses ignoring whitespace and the trailing slash. */
function isSameTarget(a?: string, b?: string): boolean {
	if (!a || !b) {
		return false;
	}
	return a.trim().replace(/\/+$/, '') === b.trim().replace(/\/+$/, '');
}

/** Summarizes the API error body so it can be included in the node message. */
function describeApiError(body: IDataObject): string {
	if (!body || typeof body !== 'object') {
		return '';
	}
	if (typeof body.detail === 'string') {
		return body.detail;
	}
	const parts: string[] = [];
	for (const [field, messages] of Object.entries(body)) {
		if (Array.isArray(messages)) {
			parts.push(`${field}: ${messages.join(' ')}`);
		} else if (typeof messages === 'string') {
			parts.push(`${field}: ${messages}`);
		}
	}
	return parts.join(' | ');
}

function getEntityForEvent(this: IHookFunctions): string {
	const event = this.getNodeParameter('event') as string;
	const entity = EVENT_PREFIX_TO_ENTITY[(event || '').split('.')[0]];

	if (!entity) {
		throw new NodeOperationError(
			this.getNode(),
			`The event "${event}" does not belong to any Clientify webhook entity`,
		);
	}

	return entity;
}

function throwApiError(
	this: IHookFunctions,
	response: ClientifyApiResponse,
	action: string,
): never {
	throw new NodeApiError(this.getNode(), response.body as JsonObject, {
		message: `Clientify returned ${response.statusCode} while ${action}`,
		description: describeApiError(response.body),
		httpCode: String(response.statusCode),
	});
}

/** Turns the slot back on if someone switched it off from the dashboard. */
async function activateWebhook(this: IHookFunctions, entity: string): Promise<void> {
	const response = await clientifyApiRequest.call(this, 'POST', `/webhooks/${entity}/activate/`);
	if (response.statusCode >= 400) {
		throwApiError.call(this, response, `activating the "${entity}" webhook`);
	}
}

function buildConflictError(
	this: IHookFunctions,
	entity: string,
	occupiedBy: string,
): NodeOperationError {
	return new NodeOperationError(
		this.getNode(),
		`The Clientify "${entity}" webhook is already pointing to ${occupiedBy}`,
		{
			description:
				`Clientify has one single webhook per entity, so it can only notify one address for ${entity}. ` +
				'This workflow was not connected and the existing integration was left untouched. ' +
				'Free the webhook in Clientify (Settings → Integrations → Webhooks) before activating this workflow, ' +
				'or point that address to a workflow that forwards the events where you need them.',
		},
	);
}

/** Returns the resource carried in the notification, supporting legacy formats. */
function getPayloadResource(
	payload: ClientifyWebhookPayload,
	entityKey: string,
): IDataObject | undefined {
	const data = payload.data;

	if (data && typeof data === 'object') {
		const nested = data[entityKey];
		if (nested && typeof nested === 'object') {
			return nested as IDataObject;
		}
		if ('id' in data) {
			return data;
		}
	}

	const fromRoot = payload[entityKey];
	if (fromRoot && typeof fromRoot === 'object') {
		return fromRoot as IDataObject;
	}

	return undefined;
}

// Trigger nodes cannot be invoked as AI tools, so usableAsTool is intentionally omitted.
// eslint-disable-next-line @n8n/community-nodes/node-usable-as-tool
export class ClientifyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clientify Trigger',
		name: 'clientifyTrigger',
		icon: {
			light: 'file:clientify.svg',
			dark: 'file:clientify.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when Clientify reports a change in the CRM',
		defaults: {
			name: 'Clientify Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'clientifyApi',
				required: true,
			},
		],
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
				description:
					'The Clientify event that starts this workflow. Clientify keeps one webhook per entity covering both its saved and deleted events, so activating this workflow registers that entity webhook.',
				options: [
					{
						name: 'Budget Deleted',
						value: 'budget.deleted',
						description: 'Triggers when a budget is deleted in Clientify',
					},
					{
						name: 'Budget Saved',
						value: 'budget.saved',
						description: 'Triggers when a budget is created or updated in Clientify',
					},
					{
						name: 'Company Deleted',
						value: 'company.deleted',
						description: 'Triggers when a company is deleted in Clientify',
					},
					{
						name: 'Company Saved',
						value: 'company.saved',
						description: 'Triggers when a company is created or updated in Clientify',
					},
					{
						name: 'Contact Deleted',
						value: 'contact.deleted',
						description: 'Triggers when a contact is deleted in Clientify',
					},
					{
						name: 'Contact Saved',
						value: 'contact.saved',
						description: 'Triggers when a contact is created or updated in Clientify',
					},
					{
						name: 'Deal Deleted',
						value: 'deal.deleted',
						description: 'Triggers when a deal is deleted in Clientify',
					},
					{
						name: 'Deal Saved',
						value: 'deal.saved',
						description:
							'Triggers when a deal is created, updated, won, lost, or moved in Clientify',
					},
					{
						name: 'Product Deleted',
						value: 'product.deleted',
						description: 'Triggers when a product is deleted in Clientify',
					},
					{
						name: 'Product Saved',
						value: 'product.saved',
						description: 'Triggers when a product is created or updated in Clientify',
					},
					{
						name: 'Task Deleted',
						value: 'task.deleted',
						description: 'Triggers when a task is deleted in Clientify',
					},
					{
						name: 'Task Saved',
						value: 'task.saved',
						description: 'Triggers when a task is created or updated in Clientify',
					},
				],
			},
			{
				displayName: 'Receive Both Entity Events',
				name: 'bothEntityEvents',
				type: 'boolean',
				default: false,
				description:
					'Whether to run the workflow for both the saved and the deleted event of the entity. The registered webhook always delivers both, so the other one is discarded unless this is enabled.',
			},
		],
	};

	webhookMethods = {
		default: {
			/**
			 * n8n asks whether the webhook is already registered. It only answers yes
			 * when that entity's slot points to this workflow's URL.
			 */
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				if (!webhookUrl) {
					return false;
				}

				const entity = getEntityForEvent.call(this);
				const response = await clientifyApiRequest.call(this, 'GET', `/webhooks/${entity}/`);

				if (response.statusCode === 404) {
					return false;
				}
				if (response.statusCode >= 400) {
					throwApiError.call(this, response, `reading the "${entity}" webhook`);
				}

				const hook = response.body as ClientifyWebhook;
				if (!isSameTarget(hook.target, webhookUrl)) {
					// The slot is free or taken by another integration: create() handles it.
					return false;
				}

				if (hook.is_active === false) {
					await activateWebhook.call(this, entity);
				}

				const staticData = this.getWorkflowStaticData('node');
				staticData.webhookEntity = entity;
				staticData.webhookTarget = webhookUrl;

				return true;
			},

			/** Registers this workflow's URL in the entity slot. */
			async create(this: IHookFunctions): Promise<boolean> {
				const node = this.getNode();
				const webhookUrl = this.getNodeWebhookUrl('default');

				if (!webhookUrl) {
					throw new NodeOperationError(node, 'n8n did not provide a webhook URL for this trigger');
				}

				if (!webhookUrl.toLowerCase().startsWith('https://')) {
					throw new NodeOperationError(
						node,
						`Clientify only accepts public HTTPS webhook addresses, and this n8n instance produced "${webhookUrl}"`,
						{
							description:
								'Serve n8n over HTTPS on a public domain (or use a tunnel) and set WEBHOOK_URL to that address, then activate the workflow again.',
						},
					);
				}

				const entity = getEntityForEvent.call(this);
				const current = await clientifyApiRequest.call(this, 'GET', `/webhooks/${entity}/`);

				if (current.statusCode === 404) {
					throw new NodeOperationError(
						node,
						`Clientify does not expose a webhook for "${entity}"`,
						{
							description:
								'The CRM webhooks are contacts, companies, deals, tasks, budgets and products. Update the node if Clientify added a new one.',
						},
					);
				}
				if (current.statusCode >= 400) {
					throwApiError.call(this, current, `reading the "${entity}" webhook`);
				}

				const hook = current.body as ClientifyWebhook;
				const currentTarget = (hook.target ?? '').trim();

				if (currentTarget && !isSameTarget(currentTarget, webhookUrl)) {
					throw buildConflictError.call(this, entity, currentTarget);
				}

				const staticData = this.getWorkflowStaticData('node');

				if (isSameTarget(currentTarget, webhookUrl)) {
					// Already set (from the dashboard or by a previous activation).
					if (hook.is_active === false) {
						await activateWebhook.call(this, entity);
					}
					staticData.webhookEntity = entity;
					staticData.webhookTarget = webhookUrl;
					return true;
				}

				// Clientify does not sign requests with HMAC, so a shared secret in a
				// header is the only way to recognize the notification as ours.
				const secret = randomBytes(24).toString('hex');
				const created = await clientifyApiRequest.call(this, 'POST', `/webhooks/${entity}/`, {
					target: webhookUrl,
					headers: {
						[SECRET_HEADER_NAME]: secret,
					},
				});

				if (created.statusCode === 409) {
					// Someone took the slot between the read and the registration.
					const latest = await clientifyApiRequest.call(this, 'GET', `/webhooks/${entity}/`);
					const latestTarget = ((latest.body as ClientifyWebhook).target ?? '').trim();

					if (isSameTarget(latestTarget, webhookUrl)) {
						staticData.webhookEntity = entity;
						staticData.webhookTarget = webhookUrl;
						return true;
					}

					throw buildConflictError.call(this, entity, latestTarget || 'another address');
				}

				if (created.statusCode === 400) {
					throw new NodeOperationError(
						node,
						`Clientify rejected the webhook address "${webhookUrl}"`,
						{
							description:
								'The address must be a publicly reachable HTTPS URL: internal or private hosts are refused. ' +
								describeApiError(created.body),
						},
					);
				}

				if (created.statusCode >= 400) {
					throwApiError.call(this, created, `registering the "${entity}" webhook`);
				}

				staticData.webhookEntity = entity;
				staticData.webhookTarget = webhookUrl;
				staticData.webhookSecret = secret;

				return true;
			},

			/** Frees the slot when the workflow is deactivated. */
			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const registeredTarget = (staticData.webhookTarget as string) || webhookUrl;
				const entity = (staticData.webhookEntity as string) || getEntityForEvent.call(this);

				const current = await clientifyApiRequest.call(this, 'GET', `/webhooks/${entity}/`);

				if (current.statusCode < 400) {
					const hook = current.body as ClientifyWebhook;
					const currentTarget = (hook.target ?? '').trim();
					const isOurs =
						isSameTarget(currentTarget, registeredTarget) || isSameTarget(currentTarget, webhookUrl);

					// If another integration has taken the slot in the meantime, leave it alone.
					if (isOurs) {
						const removed = await clientifyApiRequest.call(
							this,
							'DELETE',
							`/webhooks/${entity}/`,
						);

						if (removed.statusCode >= 400 && removed.statusCode !== 404) {
							throwApiError.call(this, removed, `deleting the "${entity}" webhook`);
						}
					}
				} else if (current.statusCode !== 404) {
					throwApiError.call(this, current, `reading the "${entity}" webhook`);
				}

				delete staticData.webhookEntity;
				delete staticData.webhookTarget;
				delete staticData.webhookSecret;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const event = this.getNodeParameter('event') as string;
		const bothEntityEvents = this.getNodeParameter('bothEntityEvents', false) as boolean;
		const staticData = this.getWorkflowStaticData('node');
		const expectedSecret = staticData.webhookSecret as string | undefined;

		// If this node registered the webhook, the notification must carry its secret.
		if (expectedSecret) {
			const receivedSecret = req.headers[SECRET_HEADER_NAME.toLowerCase()];
			if (receivedSecret !== expectedSecret) {
				return {
					workflowData: [],
				};
			}
		}

		const payload = req.body as ClientifyWebhookPayload;

		if (!payload || typeof payload !== 'object') {
			return {
				workflowData: [],
			};
		}

		const payloadEvent = payload.event || payload.hook?.event;

		if (!payloadEvent) {
			return {
				workflowData: [],
			};
		}

		// A single slot delivers both events of the entity, so the one not requested
		// is discarded unless the user wants both.
		const matchesEvent = bothEntityEvents
			? payloadEvent.split('.')[0] === event.split('.')[0]
			: payloadEvent === event;

		if (!matchesEvent) {
			return {
				workflowData: [],
			};
		}

		let workflowData: IDataObject = {
			event: payloadEvent,
		};

		if (payload.timestamp) {
			workflowData.timestamp = payload.timestamp;
		}
		if (payload.hook?.id) {
			workflowData.hook_id = payload.hook.id;
		}
		if (payload.account_id) {
			workflowData.account_id = payload.account_id;
		}
		if (payload.user_id) {
			workflowData.user_id = payload.user_id;
		}

		// The full resource travels in `data`; it is flattened and a per-entity id
		// alias is added so users do not have to remember where it lives.
		const entityKey = payloadEvent.split('.')[0];
		const resource = getPayloadResource(payload, entityKey);

		if (resource) {
			workflowData = {
				...workflowData,
				[`${entityKey}_id`]: resource.id,
				...resource,
			};
		}

		const changes = payload.data?.changes;
		if (changes && typeof changes === 'object' && resource !== payload.data) {
			workflowData.changes = changes as IDataObject;
		}

		// Keep the original notification for anyone who needs an unflattened field.
		workflowData._raw = payload as IDataObject;

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
