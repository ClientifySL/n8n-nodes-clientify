const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const tagId = input.tagId;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!tagId) throw new context.CancelError('tagId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/companies/${companyId}/tags/${tagId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

