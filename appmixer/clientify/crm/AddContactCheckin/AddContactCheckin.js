const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const contactId = input.contactId;
    if (!contactId) throw new context.CancelError('contactId is required');

    const payload = {
      type: input.type,
      comment: input.comment,
      outcome: input.outcome,
      date: input.date,
      owner: input.owner,
    };

    for (const key of ['type', 'comment', 'outcome', 'date', 'owner']) {
      if (!payload[key]) throw new context.CancelError(`${key} is required`);
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'POST',
      path: `/contacts/${contactId}/checkin/`,
      data: payload,
    });

    return context.sendJson(data || { ok: true }, 'out');
  },
};

