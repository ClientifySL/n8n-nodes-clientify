import { INodeProperties } from 'n8n-workflow';

import { AppmixerInspectorInput, operationDefinitions } from './operations.generated';

function mapInspectorTypeToN8nType(type: string | undefined): 'string' | 'number' | 'boolean' {
	if (type === 'number') return 'number';
	if (type === 'toggle') return 'boolean';
	return 'string';
}

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
		const inspectorInputs: Record<string, AppmixerInspectorInput> = (def as any).inspectorInputs || {};
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

export { operationDefinitions };
