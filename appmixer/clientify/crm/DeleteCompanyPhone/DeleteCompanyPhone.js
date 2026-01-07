const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const phoneId = input.phoneId;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!phoneId) throw new context.CancelError('phoneId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/companies/${companyId}/phones/${phoneId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

