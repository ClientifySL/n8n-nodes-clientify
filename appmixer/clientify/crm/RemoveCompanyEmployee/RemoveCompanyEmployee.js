const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const contactId = input.contactId;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!contactId) throw new context.CancelError('contactId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/companies/${companyId}/employees/${contactId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

