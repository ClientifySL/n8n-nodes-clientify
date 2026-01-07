const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    if (!companyId) {
      throw new context.CancelError('companyId is required');
    }

    const { companyId: _ignored, ...body } = input;
    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/companies/${companyId}/`,
      data: body,
    });

    return context.sendJson(data, 'out');
  },
};

