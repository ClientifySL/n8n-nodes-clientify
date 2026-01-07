const { clientifyRequest } = require('../clientify');
const fields = require('../fields');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const taskId = input.taskId;
    if (!taskId) {
      throw new context.CancelError('taskId is required');
    }

    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'GET',
      path: `/tasks/${taskId}/`,
      query: { fields: input.fields || fields.tasks.detail },
    });

    return context.sendJson(data, 'out');
  },
};

