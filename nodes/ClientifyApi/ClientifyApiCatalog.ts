import fs from 'fs';
import path from 'path';
import { INodeProperties } from 'n8n-workflow';

export type ClientifyHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ClientifyOperationDefinition {
	operation: string; // e.g. CreateContact (AppMixer folder name)
	label: string;
	description: string;
	method: ClientifyHttpMethod;
	pathTemplate: string;
	pathParamNames: string[];
	fixedQuery: Record<string, unknown>;
	fieldNames: string[];
	requiredFieldNames: string[];
	fieldDefaults: Record<string, unknown>;
}

type AppmixerComponentJson = {
	label?: string;
	description?: string;
	inPorts?: Array<{
		name?: string;
		schema?: { required?: string[] };
		inspector?: {
			inputs?: Record<
				string,
				{
					type?: 'text' | 'number' | 'toggle' | 'expression';
					label?: string;
					tooltip?: string;
					index?: number;
				}
			>;
		};
	}>;
};

function safeReadJson(filePath: string): unknown | null {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return null;
	}
}

function extractMethodAndPath(jsSource: string): { method: ClientifyHttpMethod; pathTemplate: string } | null {
	const methodMatch = jsSource.match(/\bmethod:\s*'([A-Z]+)'\s*,/);
	const pathMatch = jsSource.match(/\bpath:\s*(?:'([^']+)'|\"([^\"]+)\"|`([^`]+)`)\s*,?/);

	const rawMethod = methodMatch?.[1] as ClientifyHttpMethod | undefined;
	const pathTemplate = (pathMatch?.[1] || pathMatch?.[2] || pathMatch?.[3])?.trim();

	if (!rawMethod || !pathTemplate) return null;
	if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(rawMethod)) return null;

	return { method: rawMethod, pathTemplate };
}

function extractFixedQuery(jsSource: string): Record<string, unknown> {
	// We only extract simple, literal query values (e.g. GetCurrentUser sets `fields: 'id,email'`).
	const queryBlock = jsSource.match(/\bquery:\s*\{([\s\S]*?)\}\s*,/);
	if (!queryBlock) return {};

	const content = queryBlock[1];
	const out: Record<string, unknown> = {};

	const fieldsMatch = content.match(/\bfields:\s*'([^']+)'/) || content.match(/\bfields:\s*\"([^\"]+)\"/);
	if (fieldsMatch) out.fields = fieldsMatch[1];

	return out;
}

function getPathParamNames(pathTemplate: string): string[] {
	const names = new Set<string>();
	const re = /\$\{([^}]+)\}/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(pathTemplate))) {
		const expr = match[1]?.trim();
		if (expr && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expr)) {
			names.add(expr);
		}
	}
	return Array.from(names);
}

function mapInspectorTypeToN8nType(type: string | undefined): 'string' | 'number' | 'boolean' {
	if (type === 'number') return 'number';
	if (type === 'toggle') return 'boolean';
	return 'string';
}

function loadAppmixerFieldsModule(): any {
	try {
		// In dist, we copy `appmixer/clientify/crm` to `dist/appmixer/clientify/crm`.
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require(path.resolve(__dirname, '../../appmixer/clientify/crm/fields.js'));
	} catch {
		return null;
	}
}

function getDefaultFieldsValue(operation: string, pathTemplate: string): string | undefined {
	const fields = loadAppmixerFieldsModule();
	if (!fields) return undefined;

	const isContact = pathTemplate.startsWith('/contacts/');
	const isCompany = pathTemplate.startsWith('/companies/');
	const isTask = pathTemplate.startsWith('/tasks/');
	const isUser = pathTemplate.startsWith('/users/');

	if (operation === 'ListContacts' && isContact) return fields.contacts?.list;
	if (operation === 'GetContact' && isContact) return fields.contacts?.detail;
	if (operation === 'ListCompanies' && isCompany) return fields.companies?.list;
	if (operation === 'SearchCompanies' && isCompany) return fields.companies?.list;
	if (operation === 'GetCompany' && isCompany) return fields.companies?.detail;
	if (operation === 'ListTasks' && isTask) return fields.tasks?.list;
	if (operation === 'GetTask' && isTask) return fields.tasks?.detail;
	if (operation === 'ListUsers' && isUser) return fields.users?.list;

	return undefined;
}

function discoverOperations(): Record<string, ClientifyOperationDefinition> {
	const catalog: Record<string, ClientifyOperationDefinition> = {};

	const crmDir = path.resolve(__dirname, '../../appmixer/clientify/crm');
	if (!fs.existsSync(crmDir)) {
		// Don’t throw — allow n8n to boot, but the node will have no operations.
		// eslint-disable-next-line no-console
		console.warn(`[Clientify n8n] Missing AppMixer CRM catalog at ${crmDir}.`);
		return catalog;
	}

	const entries = fs.readdirSync(crmDir, { withFileTypes: true }).filter((d) => d.isDirectory());

	for (const entry of entries) {
		const operation = entry.name;
		const componentPath = path.join(crmDir, operation, 'component.json');
		const jsPath = path.join(crmDir, operation, `${operation}.js`);

		const componentJson = safeReadJson(componentPath) as AppmixerComponentJson | null;
		if (!componentJson || !fs.existsSync(jsPath)) continue;

		const jsSource = fs.readFileSync(jsPath, 'utf8');
		const methodAndPath = extractMethodAndPath(jsSource);
		if (!methodAndPath) continue;
		const fixedQuery = extractFixedQuery(jsSource);

		const inPort = componentJson.inPorts?.find((p) => p?.name === 'in') ?? componentJson.inPorts?.[0];
		const requiredFieldNames = (inPort?.schema?.required ?? []).filter((k) => typeof k === 'string');
		const inspectorInputs = inPort?.inspector?.inputs ?? {};

		const sortedFieldEntries = Object.entries(inspectorInputs).sort((a, b) => {
			const ai = a[1]?.index ?? 9999;
			const bi = b[1]?.index ?? 9999;
			return ai - bi;
		});

		const fieldNames = sortedFieldEntries.map(([key]) => key);
		const pathParamNames = getPathParamNames(methodAndPath.pathTemplate);

		const fieldDefaults: Record<string, unknown> = {};
		if (fieldNames.includes('fields')) {
			const defaultFields = getDefaultFieldsValue(operation, methodAndPath.pathTemplate);
			if (defaultFields) fieldDefaults.fields = defaultFields;
		}

		catalog[operation] = {
			operation,
			label: componentJson.label || operation,
			description: componentJson.description || '',
			method: methodAndPath.method,
			pathTemplate: methodAndPath.pathTemplate,
			pathParamNames,
			fixedQuery,
			fieldNames,
			requiredFieldNames,
			fieldDefaults,
		};
	}

	return catalog;
}

export const operationDefinitions: Record<string, ClientifyOperationDefinition> = discoverOperations();

export const operationOptions = Object.values(operationDefinitions)
	.sort((a, b) => a.label.localeCompare(b.label))
	.map((def) => ({
		name: def.label,
		value: def.operation,
		description: def.description,
	}));

export const operationFields: INodeProperties[] = (() => {
	const fields: INodeProperties[] = [];

	for (const def of Object.values(operationDefinitions)) {
		const crmDir = path.resolve(__dirname, '../../appmixer/clientify/crm');
		const componentPath = path.join(crmDir, def.operation, 'component.json');
		const componentJson = safeReadJson(componentPath) as AppmixerComponentJson | null;
		const inPort = componentJson?.inPorts?.find((p) => p?.name === 'in') ?? componentJson?.inPorts?.[0];
		const inspectorInputs = inPort?.inspector?.inputs ?? {};

		const sortedFieldEntries = Object.entries(inspectorInputs).sort((a, b) => {
			const ai = a[1]?.index ?? 9999;
			const bi = b[1]?.index ?? 9999;
			return ai - bi;
		});

		for (const [fieldName, inputDef] of sortedFieldEntries) {
			const isRequired = def.requiredFieldNames.includes(fieldName);
			const n8nType = mapInspectorTypeToN8nType(inputDef?.type);

			const defaultValue =
				def.fieldDefaults[fieldName] ??
				(n8nType === 'number' ? 0 : n8nType === 'boolean' ? false : '');

			fields.push({
				displayName: inputDef?.label || fieldName,
				name: fieldName,
				type: n8nType,
				default: defaultValue as any,
				required: isRequired,
				description: inputDef?.tooltip || '',
				displayOptions: {
					show: {
						operation: [def.operation],
					},
				},
			});
		}
	}

	return fields;
})();

export function renderPathTemplate(pathTemplate: string, input: Record<string, unknown>): string {
	return pathTemplate.replace(/\$\{([^}]+)\}/g, (_m, expr) => {
		const key = String(expr).trim();
		const value = (input as Record<string, unknown>)[key];
		if (value === undefined || value === null) return '';
		return encodeURIComponent(String(value));
	});
}

export function omitKeys<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
	const omit = new Set(keys);
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (omit.has(k)) continue;
		out[k] = v;
	}
	return out;
}
