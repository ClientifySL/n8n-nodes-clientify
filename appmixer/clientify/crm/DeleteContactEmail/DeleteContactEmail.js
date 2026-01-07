const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    const emailId = input.emailId;
    if (!contactId) throw new context.CancelError('contactId is required');
    if (!emailId) throw new context.CancelError('emailId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/contacts/${contactId}/emails/${emailId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

