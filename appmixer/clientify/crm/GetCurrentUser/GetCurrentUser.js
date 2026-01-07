const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: '/me/',
      query: { fields: 'id,email' },
    });

    return context.sendJson(data, 'out');
  },
};
