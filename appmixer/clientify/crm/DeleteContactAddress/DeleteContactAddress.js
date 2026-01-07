const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const addressId = input.addressId;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!addressId) throw new context.CancelError('addressId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/contacts/${contactId}/addresses/${addressId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

