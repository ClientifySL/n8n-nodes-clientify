const { clientifyRequest } = require('../clientify');
const fields = require('../fields');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const query = input.query;
    if (!query) {
      throw new context.CancelError('query is required');
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: '/companies/',
      query: {
        search: query,
        page: input.page,
        page_size: input.page_size,
        fields: input.fields || fields.companies.list,
      },
    });

    return context.sendJson(data, 'out');
  },
};

