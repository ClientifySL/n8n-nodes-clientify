const DEFAULT_BASE_URL = 'https://api-plus.clientify.com/v2';

function normalizeBaseUrl(baseUrl) {
  const raw = String(baseUrl || DEFAULT_BASE_URL).trim();
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function buildUrl(baseUrl, path, query) {
  const base = normalizeBaseUrl(baseUrl);
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${p}`);
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Minimal Clientify request helper for AppMixer components.
 *
 * We prefer `context.httpRequest()` so AppMixer can handle retries/logging.
 */
async function clientifyRequest(context, { apiKey, baseUrl, method, path, query, data }) {
  if (!context?.httpRequest) {
    throw new Error('Expected AppMixer context.httpRequest to exist.');
  }
  if (!apiKey) {
    throw new Error('Missing apiKey in AppMixer connection.');
  }
  const url = buildUrl(baseUrl || DEFAULT_BASE_URL, path, query);
  return context.httpRequest({
    method,
    url,
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    data,
  });
}

module.exports = {
  DEFAULT_BASE_URL,
  clientifyRequest,
};
