const { clientifyRequest } = require('../clientify');
const fields = require('../fields');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    if (!companyId) {
      throw new context.CancelError('companyId is required');
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: `/companies/${companyId}/`,
      query: { fields: input.fields || fields.companies.detail },
    });

    return context.sendJson(data, 'out');
  },
};

