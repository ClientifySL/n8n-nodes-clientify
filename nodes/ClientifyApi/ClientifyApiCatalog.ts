import { INodeProperties } from "n8n-workflow";

import {
  AppmixerInspectorInput,
  ClientifyOperationDefinition,
  operationDefinitions as generatedDefinitions,
} from "./operations.generated";

type InspectorInput = Omit<AppmixerInspectorInput, "type"> & {
  type?: AppmixerInspectorInput["type"] | "json";
};

export type OperationDefinition = Omit<
  ClientifyOperationDefinition,
  "inspectorInputs"
> & {
  inspectorInputs: Record<string, InspectorInput>;
  /** Query params renamed on the way out: n8n field name -> API param name. */
  queryParamRenames?: Record<string, string>;
  /** Field holding a JSON object whose keys are sent as the request body. */
  jsonBodyField?: string;
};

/**
 * Fixes over the generated catalog. It mirrors the AppMixer connector, which
 * does not always match what API v2 expects; each patch was checked against
 * the API.
 */
function patchDefinitions(
  generated: Record<string, ClientifyOperationDefinition>
): Record<string, OperationDefinition> {
  const defs: Record<string, OperationDefinition> = JSON.parse(
    JSON.stringify(generated)
  );

  // The list endpoints filter by `query` and sort by `order_by`; they silently
  // ignore `search` and `ordering`. The n8n fields keep their names so existing
  // workflows keep working.
  const listQueryParamRenames = { search: "query", ordering: "order_by" };
  defs.ListContacts.queryParamRenames = listQueryParamRenames;
  defs.ListCompanies.queryParamRenames = listQueryParamRenames;

  // These endpoints answer 400 without `fields`, and the operations have no
  // field to set it.
  const tagFields = "id,name,color";
  const taskFields = generated.ListTasks.fieldDefaults.fields;
  defs.ListAllContactTags.fixedQuery = { fields: tagFields };
  defs.ListAllCompanyTags.fixedQuery = { fields: tagFields };
  defs.ListContactTasks.fixedQuery = { fields: taskFields };
  defs.ListCompanyTasks.fixedQuery = { fields: taskFields };

  // Every API path ends with a slash; without it the API answers with a redirect.
  for (const def of Object.values(defs)) {
    if (!def.pathTemplate.endsWith("/")) def.pathTemplate += "/";
  }

  // Add Contact Call has no call fields; it takes the same ones as Add Company Call.
  const companyCall = generated.AddCompanyCall;
  const contactCall = defs.AddContactCall;
  for (const fieldName of companyCall.fieldNames) {
    if (companyCall.pathParamNames.includes(fieldName)) continue;
    contactCall.fieldNames.push(fieldName);
    contactCall.inspectorInputs[fieldName] = {
      ...companyCall.inspectorInputs[fieldName],
    };
    if (companyCall.requiredFieldNames.includes(fieldName)) {
      contactCall.requiredFieldNames.push(fieldName);
    }
  }

  // The update operations only have the record ID, so there was nothing to
  // update. They take the fields to change as a JSON body, sent with PATCH:
  // only the partial update validates custom fields and applies the marketing
  // contacts limit when `marketing_status` changes.
  const updateExamples: Record<string, string> = {
    UpdateContact: '{"first_name": "Jane", "title": "CEO"}',
    UpdateCompany: '{"name": "Acme", "description": "Key account"}',
    UpdateTask: '{"name": "Call back", "description": "Ask about the renewal"}',
  };
  for (const [operation, example] of Object.entries(updateExamples)) {
    const def = defs[operation];
    def.method = "PATCH";
    def.fieldNames.push("body");
    def.requiredFieldNames.push("body");
    def.inspectorInputs.body = {
      index: def.fieldNames.length,
      label: "Body (JSON)",
      tooltip: `Fields to update, as a JSON object. Example: ${example}`,
      type: "json",
    };
    def.jsonBodyField = "body";
  }

  return defs;
}

const operationDefinitions = patchDefinitions(generatedDefinitions);

type ClientifyResource =
  | "auto"
  | "companies"
  | "contacts"
  | "tasks"
  | "users"
  | "misc";

function mapInspectorTypeToN8nType(
  type: string | undefined
): "string" | "number" | "boolean" | "json" {
  if (type === "number") return "number";
  if (type === "json") return "json";
  if (type === "toggle") return "boolean";
  return "string";
}

function inferResourceFromPath(
  pathTemplate: string
): Exclude<ClientifyResource, "auto"> {
  if (pathTemplate.startsWith("/companies/")) return "companies";
  if (pathTemplate.startsWith("/contacts/")) return "contacts";
  if (pathTemplate.startsWith("/tasks/")) return "tasks";
  if (pathTemplate.startsWith("/users/")) return "users";
  return "misc";
}

const resourceLabels: Record<Exclude<ClientifyResource, "auto">, string> = {
  companies: "Companies",
  contacts: "Contacts",
  tasks: "Tasks",
  users: "Users",
  misc: "Misc",
};

const operationResourceMap: Record<
  string,
  Exclude<ClientifyResource, "auto">
> = Object.fromEntries(
  Object.values(operationDefinitions).map((def) => [
    def.operation,
    inferResourceFromPath(def.pathTemplate),
  ])
);

export function getResourceForOperation(
  operation: string
): Exclude<ClientifyResource, "auto"> {
  return operationResourceMap[operation] ?? "misc";
}

export const resourceOptions = [
  {
    name: "Auto (Legacy Workflows)",
    value: "auto",
    description:
      "Shows all actions and keeps legacy operation-only workflows compatible",
  },
  ...Array.from(new Set(Object.values(operationResourceMap)))
    .sort((a, b) => resourceLabels[a].localeCompare(resourceLabels[b]))
    .map((resource) => ({
      name: resourceLabels[resource],
      value: resource,
      description: `Actions related to ${resourceLabels[
        resource
      ].toLowerCase()}`,
    })),
];

export const operationOptions = Object.values(operationDefinitions)
  .sort((a, b) => a.label.localeCompare(b.label))
  .map((def) => ({
    name: def.label,
    value: def.operation,
    description: def.description,
    displayOptions: {
      show: {
        resource: [getResourceForOperation(def.operation), "auto"],
      },
    },
  }));

export const operationFields: INodeProperties[] = (() => {
  const fields: INodeProperties[] = [];

  for (const def of Object.values(operationDefinitions)) {
    const resource = getResourceForOperation(def.operation);
    const inspectorInputs: Record<string, InspectorInput> =
      def.inspectorInputs || {};
    const sortedFieldEntries = Object.entries(inspectorInputs).sort((a, b) => {
      const ai = a[1]?.index ?? 9999;
      const bi = b[1]?.index ?? 9999;
      return ai - bi;
    });

    for (const [fieldName, inputDef] of sortedFieldEntries) {
      const isRequired = def.requiredFieldNames.includes(fieldName);
      const n8nType = mapInspectorTypeToN8nType(inputDef?.type);

      const fallbackDefault: string | number | boolean =
        n8nType === "number" ? 0 : n8nType === "boolean" ? false : "";
      const defaultValue =
        (def.fieldDefaults[fieldName] as string | number | boolean | undefined) ??
        fallbackDefault;

      fields.push({
        displayName: inputDef?.label || fieldName,
        name: fieldName,
        type: n8nType,
        default: defaultValue,
        required: isRequired,
        description: inputDef?.tooltip || "",
        displayOptions: {
          show: {
            resource: [resource, "auto"],
            operation: [def.operation],
          },
        },
      });
    }
  }

  return fields;
})();

export function renderPathTemplate(
  pathTemplate: string,
  input: Record<string, unknown>
): string {
  return pathTemplate.replace(/\$\{([^}]+)\}/g, (_m, expr) => {
    const key = String(expr).trim();
    const value = (input as Record<string, unknown>)[key];
    if (value === undefined || value === null) return "";
    return encodeURIComponent(String(value));
  });
}

export function omitKeys<T extends Record<string, unknown>>(
  obj: T,
  keys: string[]
): Record<string, unknown> {
  const omit = new Set(keys);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (omit.has(k)) continue;
    out[k] = v;
  }
  return out;
}

export { operationDefinitions };
