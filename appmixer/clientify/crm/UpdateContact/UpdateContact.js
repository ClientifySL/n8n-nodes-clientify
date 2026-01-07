const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    if (!contactId) {
      throw new context.CancelError('contactId is required');
    }

    const { contactId: _ignored, ...body } = input;
    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/contacts/${contactId}/`,
      data: body,
    });

    return context.sendJson(data, 'out');
  },
};

