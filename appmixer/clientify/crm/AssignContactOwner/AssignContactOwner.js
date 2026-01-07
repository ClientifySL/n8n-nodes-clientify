const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const ownerId = input.ownerId;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!ownerId) throw new context.CancelError('ownerId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/contacts/${contactId}/owner/`,
      data: { owner: ownerId },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

