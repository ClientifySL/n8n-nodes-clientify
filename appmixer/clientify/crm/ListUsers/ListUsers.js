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
      path: '/users/',
      query: {
        page: input.page,
        page_size: input.page_size,
        fields: input.fields || fields.users.list,
      },
    });

    return context.sendJson(data, 'out');
  },
};

