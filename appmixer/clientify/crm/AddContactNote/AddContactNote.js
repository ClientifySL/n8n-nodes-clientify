const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const name = input.name;
    const comment = input.comment;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!name) throw new context.CancelError('name is required');
    if (!comment) throw new context.CancelError('comment is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/contacts/${contactId}/note/`,
      data: { name, comment },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

