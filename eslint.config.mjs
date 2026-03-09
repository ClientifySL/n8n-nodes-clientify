import n8nNodeEslintConfig from "@n8n/node-cli/eslint";

const prebuiltConfig = n8nNodeEslintConfig.config ?? [];

export default [...prebuiltConfig];
