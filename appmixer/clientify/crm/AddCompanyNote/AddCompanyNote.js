const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const name = input.name;
    const comment = input.comment;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!name) throw new context.CancelError('name is required');
    if (!comment) throw new context.CancelError('comment is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/companies/${companyId}/note/`,
      data: { name, comment },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

