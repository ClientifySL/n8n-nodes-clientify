const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const title = input.title;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!title) throw new context.CancelError('title is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/contacts/${contactId}/other_companies/`,
      data: { title },
    });

    return context.sendJson(data, 'out');
  },
};

