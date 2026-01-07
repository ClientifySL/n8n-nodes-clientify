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
      call_date: input.call_date,
      call_time: input.call_time,
    };
    for (const key of ['type', 'comment', 'outcome', 'call_date', 'call_time']) {
      if (!payload[key]) throw new context.CancelError(`${key} is required`);
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/companies/${companyId}/call/`,
      data: payload,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

