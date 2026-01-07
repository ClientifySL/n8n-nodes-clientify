const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const companyId = input.companyId;
    if (!companyId) throw new context.CancelError('companyId is required');

    const payload = {
      type: input.type,
      comment: input.comment,
      outcome: input.outcome,
      date: input.date,
    };
    for (const key of ['type', 'comment', 'outcome', 'date']) {
      if (!payload[key]) throw new context.CancelError(`${key} is required`);
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/companies/${companyId}/checkin/`,
      data: payload,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

