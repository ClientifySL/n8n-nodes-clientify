const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const addressId = input.addressId;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!addressId) throw new context.CancelError('addressId is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'DELETE',
      path: `/companies/${companyId}/addresses/${addressId}/`,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

