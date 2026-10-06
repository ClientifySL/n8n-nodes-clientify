/**
 * Webhook lifecycle tests for the Clientify Trigger.
 * Mocks the functions n8n injects and checks the calls made to the API.
 */
const assert = require('assert');
const { ClientifyTrigger } = require('../dist/nodes/ClientifyTrigger/ClientifyTrigger.node.js');

const PROD_URL = 'https://n8n.example.com/webhook/abc-123/webhook';

function makeHookContext({ responses, event = 'contact.saved', webhookUrl = PROD_URL, staticData = {} }) {
	const calls = [];
	return {
		calls,
		staticData,
		getNode: () => ({ name: 'Clientify Trigger', type: 'clientifyTrigger', typeVersion: 1 }),
		getNodeWebhookUrl: () => webhookUrl,
		getNodeParameter: (name, fallback) => (name === 'event' ? event : fallback),
		getWorkflowStaticData: () => staticData,
		getCredentials: async () => ({ apiKey: 'x', baseUrl: 'https://api-plus.clientify.com/v2' }),
		helpers: {
			httpRequestWithAuthentication: async function (credType, options) {
				calls.push({ method: options.method, url: options.url, body: options.body });
				const key = `${options.method} ${options.url.replace('https://api-plus.clientify.com/v2', '')}`;
				const responder = responses[key];
				assert.ok(responder, `unexpected call: ${key}`);
				return typeof responder === 'function' ? responder() : responder;
			},
		},
	};
}

function hookBody(target, isActive = true) {
	return {
		statusCode: 200,
		body: { entity: 'contacts', target, is_active: isActive, events: ['contact.saved', 'contact.deleted'] },
	};
}

const node = new ClientifyTrigger();
const { checkExists, create, delete: remove } = node.webhookMethods.default;
let passed = 0;
const ok = (name) => { console.log(`  ok  ${name}`); passed++; };

(async () => {
	// --- checkExists -------------------------------------------------------
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody('', false) } });
		assert.strictEqual(await checkExists.call(ctx), false);
		ok('checkExists: free slot -> false');
	}
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody(PROD_URL, true) } });
		assert.strictEqual(await checkExists.call(ctx), true);
		assert.strictEqual(ctx.calls.length, 1);
		ok('checkExists: our URL active -> true without changing anything');
	}
	{
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': hookBody(PROD_URL, false),
				'POST /webhooks/contacts/activate/': { statusCode: 200, body: {} },
			},
		});
		assert.strictEqual(await checkExists.call(ctx), true);
		assert.strictEqual(ctx.calls[1].method, 'POST');
		ok('checkExists: our URL disabled -> re-enables it');
	}
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody('https://other.example.com/hook') } });
		assert.strictEqual(await checkExists.call(ctx), false);
		ok('checkExists: slot owned by another integration -> false');
	}

	// --- create ------------------------------------------------------------
	{
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': hookBody('', false),
				'POST /webhooks/contacts/': { statusCode: 201, body: { entity: 'contacts', target: PROD_URL, is_active: true } },
			},
		});
		assert.strictEqual(await create.call(ctx), true);
		const post = ctx.calls.find((c) => c.method === 'POST');
		assert.strictEqual(post.body.target, PROD_URL);
		assert.ok(/^[0-9a-f]{48}$/.test(post.body.headers['X-Clientify-Secret']), 'secret generated');
		assert.strictEqual(ctx.staticData.webhookSecret, post.body.headers['X-Clientify-Secret']);
		assert.strictEqual(ctx.staticData.webhookEntity, 'contacts');
		ok('create: free slot -> registers target + secret and stores static data');
	}
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody('https://other.example.com/hook') } });
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /already pointing to https:\/\/other\.example\.com\/hook/);
			return true;
		});
		assert.strictEqual(ctx.calls.length, 1, 'nothing is written when the slot belongs to someone else');
		ok('create: slot taken -> clear error and does not overwrite it');
	}
	{
		const ctx = makeHookContext({ responses: {}, webhookUrl: 'http://localhost:5678/webhook/abc/webhook' });
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /only accepts public HTTPS/);
			return true;
		});
		assert.strictEqual(ctx.calls.length, 0, 'does not even call the API');
		ok('create: non-https URL -> explanatory error without calling the API');
	}
	{
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': hookBody(PROD_URL, false),
				'POST /webhooks/contacts/activate/': { statusCode: 200, body: {} },
			},
		});
		assert.strictEqual(await create.call(ctx), true);
		assert.ok(!ctx.calls.some((c) => c.method === 'POST' && c.url.endsWith('/webhooks/contacts/')), 'does not re-create');
		ok('create: our URL already set but disabled -> enables it, no duplicate');
	}
	{
		let gets = 0;
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': () => (++gets === 1 ? hookBody('', false) : hookBody('https://race.example.com/h')),
				'POST /webhooks/contacts/': { statusCode: 409, body: { detail: 'Already configured' } },
			},
		});
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /already pointing to https:\/\/race\.example\.com\/h/);
			return true;
		});
		ok('create: 409 from a race -> re-reads and explains the conflict');
	}
	{
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': hookBody('', false),
				'POST /webhooks/contacts/': { statusCode: 400, body: { target: ['Enter a valid URL.'] } },
			},
		});
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /rejected the webhook address/);
			assert.match(err.description, /target: Enter a valid URL/);
			return true;
		});
		ok('create: 400 -> surfaces the reason from the API');
	}

	// --- delete ------------------------------------------------------------
	{
		const ctx = makeHookContext({
			staticData: { webhookEntity: 'contacts', webhookTarget: PROD_URL, webhookSecret: 'abc' },
			responses: {
				'GET /webhooks/contacts/': hookBody(PROD_URL),
				'DELETE /webhooks/contacts/': { statusCode: 204, body: {} },
			},
		});
		assert.strictEqual(await remove.call(ctx), true);
		assert.ok(ctx.calls.some((c) => c.method === 'DELETE'));
		assert.deepStrictEqual(ctx.staticData, {});
		ok('delete: our slot -> frees it and clears static data');
	}
	{
		const ctx = makeHookContext({
			staticData: { webhookEntity: 'contacts', webhookTarget: PROD_URL },
			responses: { 'GET /webhooks/contacts/': hookBody('https://other.example.com/hook') },
		});
		assert.strictEqual(await remove.call(ctx), true);
		assert.ok(!ctx.calls.some((c) => c.method === 'DELETE'), 'does not delete what it does not own');
		ok('delete: slot retaken by someone else -> does not delete it');
	}
	{
		const ctx = makeHookContext({
			staticData: { webhookEntity: 'contacts' },
			responses: { 'GET /webhooks/contacts/': { statusCode: 404, body: {} } },
		});
		assert.strictEqual(await remove.call(ctx), true);
		ok('delete: 404 -> workflow deactivation does not fail');
	}

	// --- webhook() ---------------------------------------------------------
	const makeWebhookContext = ({ body, headers = {}, event = 'contact.saved', both = false, staticData = {} }) => ({
		getRequestObject: () => ({ body, headers }),
		getNodeParameter: (name, fallback) => {
			if (name === 'event') return event;
			if (name === 'bothEntityEvents') return both;
			return fallback;
		},
		getWorkflowStaticData: () => staticData,
	});

	const documentedPayload = {
		hook: { id: 412, event: 'contact.saved', target: PROD_URL },
		data: { id: 88123456, first_name: 'Ada', last_name: 'Lovelace', status: 'lead' },
	};

	{
		const res = await node.webhook.call(makeWebhookContext({ body: documentedPayload }));
		const json = res.workflowData[0][0].json;
		assert.strictEqual(json.event, 'contact.saved');
		assert.strictEqual(json.contact_id, 88123456);
		assert.strictEqual(json.first_name, 'Ada');
		assert.strictEqual(json.hook_id, 412);
		assert.deepStrictEqual(json._raw, documentedPayload);
		ok('webhook: documented {hook, data} shape -> flattened with id alias');
	}
	{
		const legacy = { event: 'contact.saved', contact: { id: 1, first_name: 'Ada' } };
		const res = await node.webhook.call(makeWebhookContext({ body: legacy }));
		assert.strictEqual(res.workflowData[0][0].json.contact_id, 1);
		ok('webhook: legacy shape with the entity at the root still works');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({ body: { hook: { event: 'contact.deleted' }, data: { id: 9 } } }),
		);
		assert.deepStrictEqual(res.workflowData, []);
		ok('webhook: the other event of the entity is discarded by default');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({ body: { hook: { event: 'contact.deleted' }, data: { id: 9 } }, both: true }),
		);
		assert.strictEqual(res.workflowData[0][0].json.event, 'contact.deleted');
		ok('webhook: with "Receive Both Entity Events" the deletion is emitted too');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({ body: documentedPayload, staticData: { webhookSecret: 's3cr3t' } }),
		);
		assert.deepStrictEqual(res.workflowData, []);
		ok('webhook: notification without the registered secret -> discarded');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({
				body: documentedPayload,
				headers: { 'x-clientify-secret': 's3cr3t' },
				staticData: { webhookSecret: 's3cr3t' },
			}),
		);
		assert.strictEqual(res.workflowData[0][0].json.contact_id, 88123456);
		ok('webhook: notification with the correct secret -> processed');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({
				body: { hook: { event: 'budget.saved' }, data: { id: 77, name: 'Presupuesto' } },
				event: 'budget.saved',
			}),
		);
		assert.strictEqual(res.workflowData[0][0].json.budget_id, 77);
		ok('webhook: new entities (budget/product) resolve their id alias');
	}

	// --- action node errors ------------------------------------------------
	const { NodeApiError, NodeOperationError } = require('n8n-workflow');
	const { ClientifyApi } = require('../dist/nodes/ClientifyApi/ClientifyApi.node.js');
	const actionNode = new ClientifyApi();

	const makeExecuteContext = ({ operation = 'GetCurrentUser', params = {}, result, continueOnFail = false }) => ({
		getInputData: () => [{ json: {} }],
		getNode: () => ({ name: 'Clientify', type: 'clientifyApi', typeVersion: 1 }),
		continueOnFail: () => continueOnFail,
		getCredentials: async () => ({ apiKey: 'x', baseUrl: 'https://api-plus.clientify.com/v2' }),
		getNodeParameter: (name) => {
			if (name === 'resource') return 'auto';
			if (name === 'operation') return operation;
			if (name in params) return params[name];
			throw new Error(`parameter not set: ${name}`);
		},
		helpers: {
			httpRequestWithAuthentication: async () => {
				if (result instanceof Error) throw result;
				return result;
			},
		},
	});

	{
		const ctx = makeExecuteContext({ result: { id: 7, email: 'rafa@example.com' } });
		const [items] = await actionNode.execute.call(ctx);
		assert.strictEqual(items[0].json.id, 7);
		assert.strictEqual(items[0].json._meta.path, '/me/');
		ok('action: successful response -> item with _meta');
	}
	{
		const apiFailure = Object.assign(new Error('Request failed with status code 401'), {
			statusCode: 401,
			response: { body: { detail: 'Invalid token.' } },
		});
		const ctx = makeExecuteContext({ result: apiFailure });
		await assert.rejects(() => actionNode.execute.call(ctx), (err) => {
			assert.ok(err instanceof NodeApiError, `expected NodeApiError but got ${err.constructor.name}`);
			return true;
		});
		ok('action: HTTP failure -> NodeApiError, never the raw error');
	}
	{
		const ctx = makeExecuteContext({ operation: 'AddCompanyAddress', params: { companyId: 0 } });
		await assert.rejects(() => actionNode.execute.call(ctx), (err) => {
			assert.ok(err instanceof NodeOperationError, `expected NodeOperationError but got ${err.constructor.name}`);
			assert.ok(!(err instanceof NodeApiError), 'a validation error must not be raised as NodeApiError');
			return true;
		});
		ok('action: missing required field -> NodeOperationError unchanged');
	}
	{
		const ctx = makeExecuteContext({ result: new Error('boom'), continueOnFail: true });
		const [items] = await actionNode.execute.call(ctx);
		assert.strictEqual(items[0].json.success, false);
		ok('action: with Continue On Fail the item holds the error and the flow continues');
	}

	console.log(`\n${passed} tests passed`);
})().catch((err) => {
	console.error('FAILED:', err);
	process.exit(1);
});
