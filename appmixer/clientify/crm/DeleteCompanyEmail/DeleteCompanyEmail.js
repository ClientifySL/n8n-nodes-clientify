const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const emailId = input.emailId;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!emailId) throw new context.CancelError('emailId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/companies/${companyId}/emails/${emailId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

