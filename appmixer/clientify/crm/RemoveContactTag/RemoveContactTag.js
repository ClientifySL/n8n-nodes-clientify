const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const tagId = input.tagId;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!tagId) throw new context.CancelError('tagId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/contacts/${contactId}/tags/${tagId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

