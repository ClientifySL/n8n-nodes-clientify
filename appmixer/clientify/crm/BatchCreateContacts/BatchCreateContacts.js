const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contacts = input.contacts;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      throw new context.CancelError('contacts must be a non-empty array');
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: '/multiple-contacts/',
      data: contacts,
    });

    return context.sendJson(data, 'out');
  },
};

