const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: '/tasks/types/',
      query: { page: input.page, page_size: input.page_size },
    });

    return context.sendJson(data, 'out');
  },
};

