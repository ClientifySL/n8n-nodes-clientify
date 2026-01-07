const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const phone = input.phone;
    const type = input.type;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!phone) throw new context.CancelError('phone is required');
    if (!type) throw new context.CancelError('type is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/contacts/${contactId}/phones/`,
      data: { phone, type },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

