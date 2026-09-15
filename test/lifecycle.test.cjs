/**
 * Pruebas del ciclo de vida del webhook del Clientify Trigger.
 * Simula las funciones que n8n inyecta y comprueba las llamadas a la API.
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
		ok('checkExists: hueco libre -> false');
	}
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody(PROD_URL, true) } });
		assert.strictEqual(await checkExists.call(ctx), true);
		assert.strictEqual(ctx.calls.length, 1);
		ok('checkExists: nuestra URL activa -> true sin tocar nada');
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
		ok('checkExists: nuestra URL apagada -> la reactiva');
	}
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody('https://otro.com/hook') } });
		assert.strictEqual(await checkExists.call(ctx), false);
		ok('checkExists: hueco de otra integracion -> false');
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
		assert.ok(/^[0-9a-f]{48}$/.test(post.body.headers['X-Clientify-Secret']), 'secreto generado');
		assert.strictEqual(ctx.staticData.webhookSecret, post.body.headers['X-Clientify-Secret']);
		assert.strictEqual(ctx.staticData.webhookEntity, 'contacts');
		ok('create: hueco libre -> alta con target + secreto y guarda static data');
	}
	{
		const ctx = makeHookContext({ responses: { 'GET /webhooks/contacts/': hookBody('https://otro.com/hook') } });
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /already pointing to https:\/\/otro\.com\/hook/);
			return true;
		});
		assert.strictEqual(ctx.calls.length, 1, 'no se escribe nada cuando el hueco es de otro');
		ok('create: hueco ocupado -> error claro y no lo pisa');
	}
	{
		const ctx = makeHookContext({ responses: {}, webhookUrl: 'http://localhost:5678/webhook/abc/webhook' });
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /only accepts public HTTPS/);
			return true;
		});
		assert.strictEqual(ctx.calls.length, 0, 'ni siquiera llama a la API');
		ok('create: URL no https -> error explicativo sin llamar a la API');
	}
	{
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': hookBody(PROD_URL, false),
				'POST /webhooks/contacts/activate/': { statusCode: 200, body: {} },
			},
		});
		assert.strictEqual(await create.call(ctx), true);
		assert.ok(!ctx.calls.some((c) => c.method === 'POST' && c.url.endsWith('/webhooks/contacts/')), 'no re-crea');
		ok('create: nuestra URL ya puesta pero apagada -> la activa, no duplica');
	}
	{
		let gets = 0;
		const ctx = makeHookContext({
			responses: {
				'GET /webhooks/contacts/': () => (++gets === 1 ? hookBody('', false) : hookBody('https://carrera.com/h')),
				'POST /webhooks/contacts/': { statusCode: 409, body: { detail: 'Already configured' } },
			},
		});
		await assert.rejects(() => create.call(ctx), (err) => {
			assert.match(err.message, /already pointing to https:\/\/carrera\.com\/h/);
			return true;
		});
		ok('create: 409 por carrera -> relee y explica el conflicto');
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
		ok('create: 400 -> traslada el motivo de la API');
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
		ok('delete: nuestro hueco -> lo libera y limpia static data');
	}
	{
		const ctx = makeHookContext({
			staticData: { webhookEntity: 'contacts', webhookTarget: PROD_URL },
			responses: { 'GET /webhooks/contacts/': hookBody('https://otro.com/hook') },
		});
		assert.strictEqual(await remove.call(ctx), true);
		assert.ok(!ctx.calls.some((c) => c.method === 'DELETE'), 'no borra lo que no es suyo');
		ok('delete: hueco reocupado por otro -> no lo borra');
	}
	{
		const ctx = makeHookContext({
			staticData: { webhookEntity: 'contacts' },
			responses: { 'GET /webhooks/contacts/': { statusCode: 404, body: {} } },
		});
		assert.strictEqual(await remove.call(ctx), true);
		ok('delete: 404 -> no falla la desactivacion del workflow');
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
		ok('webhook: formato documentado {hook, data} -> aplanado con alias de id');
	}
	{
		const legacy = { event: 'contact.saved', contact: { id: 1, first_name: 'Ada' } };
		const res = await node.webhook.call(makeWebhookContext({ body: legacy }));
		assert.strictEqual(res.workflowData[0][0].json.contact_id, 1);
		ok('webhook: formato antiguo con la entidad en raiz sigue funcionando');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({ body: { hook: { event: 'contact.deleted' }, data: { id: 9 } } }),
		);
		assert.deepStrictEqual(res.workflowData, []);
		ok('webhook: el otro evento de la entidad se descarta por defecto');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({ body: { hook: { event: 'contact.deleted' }, data: { id: 9 } }, both: true }),
		);
		assert.strictEqual(res.workflowData[0][0].json.event, 'contact.deleted');
		ok('webhook: con "Receive Both Entity Events" se emite tambien el borrado');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({ body: documentedPayload, staticData: { webhookSecret: 's3cr3t' } }),
		);
		assert.deepStrictEqual(res.workflowData, []);
		ok('webhook: aviso sin el secreto registrado -> descartado');
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
		ok('webhook: aviso con el secreto correcto -> se procesa');
	}
	{
		const res = await node.webhook.call(
			makeWebhookContext({
				body: { hook: { event: 'budget.saved' }, data: { id: 77, name: 'Presupuesto' } },
				event: 'budget.saved',
			}),
		);
		assert.strictEqual(res.workflowData[0][0].json.budget_id, 77);
		ok('webhook: entidades nuevas (budget/product) resuelven su alias de id');
	}

	// --- errores del nodo de accion -----------------------------------------
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
		ok('accion: respuesta correcta -> item con _meta');
	}
	{
		const apiFailure = Object.assign(new Error('Request failed with status code 401'), {
			statusCode: 401,
			response: { body: { detail: 'Invalid token.' } },
		});
		const ctx = makeExecuteContext({ result: apiFailure });
		await assert.rejects(() => actionNode.execute.call(ctx), (err) => {
			assert.ok(err instanceof NodeApiError, `se esperaba NodeApiError y llego ${err.constructor.name}`);
			return true;
		});
		ok('accion: fallo HTTP -> NodeApiError, nunca el error crudo');
	}
	{
		const ctx = makeExecuteContext({ operation: 'AddCompanyAddress', params: { companyId: 0 } });
		await assert.rejects(() => actionNode.execute.call(ctx), (err) => {
			assert.ok(err instanceof NodeOperationError, `se esperaba NodeOperationError y llego ${err.constructor.name}`);
			assert.ok(!(err instanceof NodeApiError), 'un error de validacion no debe viajar como NodeApiError');
			return true;
		});
		ok('accion: campo requerido ausente -> NodeOperationError intacto');
	}
	{
		const ctx = makeExecuteContext({ result: new Error('boom'), continueOnFail: true });
		const [items] = await actionNode.execute.call(ctx);
		assert.strictEqual(items[0].json.success, false);
		ok('accion: con Continue On Fail el item recoge el error y no rompe el flujo');
	}

	console.log(`\n${passed} pruebas OK`);
})().catch((err) => {
	console.error('FALLO:', err);
	process.exit(1);
});
