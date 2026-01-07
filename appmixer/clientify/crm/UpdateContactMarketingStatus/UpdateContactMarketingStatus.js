const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const marketingStatus = input.marketing_status;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (typeof marketingStatus !== 'boolean') {
      throw new context.CancelError('marketing_status must be a boolean');
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/contacts/${contactId}/marketing_status/`,
      data: { marketing_status: marketingStatus },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

