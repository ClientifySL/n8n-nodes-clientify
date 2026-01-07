const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const phoneId = input.phoneId;
    const phone = input.phone;
    const type = input.type;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!phoneId) throw new context.CancelError('phoneId is required');
    if (!phone) throw new context.CancelError('phone is required');
    if (!type) throw new context.CancelError('type is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/contacts/${contactId}/phones/${phoneId}/`,
      data: { phone, type },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

