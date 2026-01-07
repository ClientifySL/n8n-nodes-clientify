const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const name = input.name;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!name) throw new context.CancelError('name is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/companies/${companyId}/tags/`,
      data: { name },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

