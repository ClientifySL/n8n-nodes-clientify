const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    const websiteId = input.websiteId;
    const website = input.website;
    if (!companyId) throw new context.CancelError('companyId is required');
    if (!websiteId) throw new context.CancelError('websiteId is required');
    if (!website) throw new context.CancelError('website is required');

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/companies/${companyId}/websites/${websiteId}/`,
      data: { website },
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

