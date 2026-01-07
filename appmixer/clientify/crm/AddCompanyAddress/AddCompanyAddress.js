const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    if (!companyId) throw new context.CancelError('companyId is required');

    const payload = {
      type: input.type,
      street: input.street,
      city: input.city,
      state: input.state,
      country: input.country,
      postal_code: input.postal_code,
    };
    for (const key of ['type', 'street', 'city', 'state', 'country', 'postal_code']) {
      if (!payload[key]) throw new context.CancelError(`${key} is required`);
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/companies/${companyId}/addresses/`,
      data: payload,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

