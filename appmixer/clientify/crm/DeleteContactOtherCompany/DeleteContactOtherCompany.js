const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const otherCompanyId = input.otherCompanyId;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!otherCompanyId) throw new context.CancelError('otherCompanyId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/contacts/${contactId}/other_companies/${otherCompanyId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

