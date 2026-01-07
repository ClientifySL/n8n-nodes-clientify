const { clientifyRequest } = require('../clientify');
const fields = require('../fields');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: '/companies/',
      query: {
        page: input.page,
        page_size: input.page_size,
        search: input.search,
        ordering: input.ordering,
        fields: input.fields || fields.companies.list,
      },
    });

    return context.sendJson(data, 'out');
  },
};

