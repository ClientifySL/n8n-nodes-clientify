const { clientifyRequest } = require('../clientify');

module.exports = {
  async receive(context) {
    const { apiKey, baseUrl } = context.auth;
    const input = (context.messages.in && context.messages.in.content) || {};
    const taskId = input.taskId;
    if (!taskId) {
      throw new context.CancelError('taskId is required');
    }

    const { taskId: _ignored, ...body } = input;
    const { data } = await clientifyRequest(context, {
      apiKey,
      baseUrl,
      method: 'PUT',
      path: `/tasks/${taskId}/`,
      data: body,
    });

    return context.sendJson(data, 'out');
  },
};

