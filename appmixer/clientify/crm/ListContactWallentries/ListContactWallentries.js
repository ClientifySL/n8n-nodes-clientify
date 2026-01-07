const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    if (!contactId) throw new context.CancelError('contactId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: `/contacts/${contactId}/wallentries`,
    });

    return context.sendJson(data, 'out');
  },
};

