const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const email = input.email;
    const type = input.type;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!email) throw new context.CancelError('email is required');
    if (!type) throw new context.CancelError('type is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/companies/${companyId}/emails/`,
      data: { email, type },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

