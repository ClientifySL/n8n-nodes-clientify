const fs = require("fs");
const path = require("path");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function extractMethodAndPath(jsSource) {
  const methodMatch = jsSource.match(/\bmethod:\s*'([A-Z]+)'\s*,/);
  const pathMatch = jsSource.match(
    /\bpath:\s*(?:'([^']+)'|\"([^\"]+)\"|`([^`]+)`)\s*,?/
  );

  const method = methodMatch?.[1];
  const pathTemplate = (
    pathMatch?.[1] ||
    pathMatch?.[2] ||
    pathMatch?.[3]
  )?.trim();

  if (!method || !pathTemplate) return null;
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) return null;
  return { method, pathTemplate };
}

function extractFixedQuery(jsSource) {
  const queryBlock = jsSource.match(/\bquery:\s*\{([\s\S]*?)\}\s*,/);
  if (!queryBlock) return {};

  const content = queryBlock[1];
  const out = {};
  const fieldsMatch =
    content.match(/\bfields:\s*'([^']+)'/) ||
    content.match(/\bfields:\s*\"([^\"]+)\"/);
  if (fieldsMatch) out.fields = fieldsMatch[1];
  return out;
}

function getPathParamNames(pathTemplate) {
  const names = new Set();
  const re = /\$\{([^}]+)\}/g;
  let match;
  while ((match = re.exec(pathTemplate))) {
    const expr = match[1]?.trim();
    if (expr && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expr)) {
      names.add(expr);
    }
  }
  return Array.from(names);
}

function loadFieldsJs(crmDir) {
  const p = path.join(crmDir, "fields.js");
  if (!fs.existsSync(p)) return null;
  return require(p);
}

function getDefaultFieldsValue(fields, operation, pathTemplate) {
  if (!fields) return undefined;
  const isContact = pathTemplate.startsWith("/contacts/");
  const isCompany = pathTemplate.startsWith("/companies/");
  const isTask = pathTemplate.startsWith("/tasks/");
  const isUser = pathTemplate.startsWith("/users/");

  if (operation === "ListContacts" && isContact) return fields.contacts?.list;
  if (operation === "GetContact" && isContact) return fields.contacts?.detail;
  if (operation === "ListCompanies" && isCompany) return fields.companies?.list;
  if (operation === "SearchCompanies" && isCompany)
    return fields.companies?.list;
  if (operation === "GetCompany" && isCompany) return fields.companies?.detail;
  if (operation === "ListTasks" && isTask) return fields.tasks?.list;
  if (operation === "GetTask" && isTask) return fields.tasks?.detail;
  if (operation === "ListUsers" && isUser) return fields.users?.list;

  return undefined;
}

function resolveCrmDir(packageRoot) {
  const tried = [];
  const env = process.env.CLIENTIFY_CRM_CATALOG_DIR;
  if (env) {
    tried.push(env);
    if (fs.existsSync(env)) return { crmDir: env, tried };
  }

  // Legacy local layout (optional): <pkg>/appmixer/clientify/crm
  const local = path.join(packageRoot, "appmixer", "clientify", "crm");
  tried.push(local);
  if (fs.existsSync(local)) return { crmDir: local, tried };

  // Monorepo layout (authoritative source): <pkg>/../../../appmixer/clientify/crm
  const monorepo = path.join(
    packageRoot,
    "..",
    "..",
    "..",
    "appmixer",
    "clientify",
    "crm"
  );
  tried.push(monorepo);
  if (fs.existsSync(monorepo)) return { crmDir: monorepo, tried };

  return { crmDir: null, tried };
}

function sortObjectDeep(value) {
  if (Array.isArray(value)) return value.map(sortObjectDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortObjectDeep(value[key]);
    }
    return out;
  }
  return value;
}

function toTsString(value) {
  return JSON.stringify(sortObjectDeep(value), null, 2);
}

function main() {
  const packageRoot = process.cwd();
  const outPath = path.join(
    packageRoot,
    "nodes",
    "ClientifyApi",
    "operations.generated.ts"
  );
  const resolved = resolveCrmDir(packageRoot);
  const crmDir = resolved.crmDir;
  if (!crmDir) {
    if (fs.existsSync(outPath)) {
      console.warn(
        `[Clientify n8n] CRM catalog dir not found; keeping existing generated catalog: ${outPath}\nTried:\n- ${resolved.tried.join(
          "\n- "
        )}\nSet CLIENTIFY_CRM_CATALOG_DIR to regenerate.`
      );
      return;
    }
    throw new Error(
      `Could not find CRM catalog dir and no generated catalog exists. Tried:\n- ${resolved.tried.join(
        "\n- "
      )}\nExpected generated file at: ${outPath}\nSet CLIENTIFY_CRM_CATALOG_DIR to override.`
    );
  }
  const fields = loadFieldsJs(crmDir);

  const entries = fs
    .readdirSync(crmDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const defs = {};

  for (const entry of entries) {
    const operation = entry.name;
    const componentPath = path.join(crmDir, operation, "component.json");
    const jsPath = path.join(crmDir, operation, `${operation}.js`);
    if (!fs.existsSync(componentPath) || !fs.existsSync(jsPath)) continue;

    const componentJson = readJson(componentPath);
    const jsSource = fs.readFileSync(jsPath, "utf8");
    const methodAndPath = extractMethodAndPath(jsSource);
    if (!methodAndPath) continue;

    const fixedQuery = extractFixedQuery(jsSource);
    const inPort =
      (componentJson.inPorts || []).find((p) => p?.name === "in") ??
      (componentJson.inPorts || [])[0] ??
      {};
    const requiredFieldNames = (
      (inPort.schema && inPort.schema.required) ||
      []
    ).filter((k) => typeof k === "string");
    const inspectorInputs = (inPort.inspector && inPort.inspector.inputs) || {};

    const sortedFieldEntries = Object.entries(inspectorInputs).sort((a, b) => {
      const ai = a[1]?.index ?? 9999;
      const bi = b[1]?.index ?? 9999;
      return ai - bi;
    });
    const fieldNames = sortedFieldEntries.map(([k]) => k);

    const pathParamNames = getPathParamNames(methodAndPath.pathTemplate);

    const fieldDefaults = {};
    if (fieldNames.includes("fields")) {
      const d = getDefaultFieldsValue(
        fields,
        operation,
        methodAndPath.pathTemplate
      );
      if (d) fieldDefaults.fields = d;
    }

    defs[operation] = {
      operation,
      label: componentJson.label || operation,
      description: componentJson.description || "",
      method: methodAndPath.method,
      pathTemplate: methodAndPath.pathTemplate,
      pathParamNames,
      fixedQuery,
      fieldNames,
      requiredFieldNames,
      fieldDefaults,
      inspectorInputs,
    };
  }

  const header = `/* eslint-disable */\n// This file is generated by scripts/generateOperationCatalog.cjs.\n// Do not edit by hand.\n\n`;

  const body =
    `export type ClientifyHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';\n\n` +
    `export type AppmixerInspectorInput = {\n` +
    `  type?: 'text' | 'number' | 'toggle' | 'expression';\n` +
    `  label?: string;\n` +
    `  tooltip?: string;\n` +
    `  index?: number;\n` +
    `};\n\n` +
    `export type ClientifyOperationDefinition = {\n` +
    `  operation: string;\n` +
    `  label: string;\n` +
    `  description: string;\n` +
    `  method: ClientifyHttpMethod;\n` +
    `  pathTemplate: string;\n` +
    `  pathParamNames: string[];\n` +
    `  fixedQuery: Record<string, unknown>;\n` +
    `  fieldNames: string[];\n` +
    `  requiredFieldNames: string[];\n` +
    `  fieldDefaults: Record<string, unknown>;\n` +
    `  inspectorInputs: Record<string, AppmixerInspectorInput>;\n` +
    `};\n\n` +
    `export const operationDefinitions: Record<string, ClientifyOperationDefinition> = ${toTsString(
      defs
    )} as any;\n`;

  fs.writeFileSync(outPath, header + body, "utf8");
  console.log(
    `[Clientify n8n] Generated operation catalog: ${outPath} (${
      Object.keys(defs).length
    } ops)`
  );
}

main();
