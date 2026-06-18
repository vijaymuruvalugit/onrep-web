import http from '../../../api/http';

export const communicationsApi = {
  async getInbox({ limit = 30, offset = 0 } = {}) {
    const { data } = await http.get('/communications/inbox', { params: { limit, offset } });
    return data?.messages || [];
  },

  async getUnreadCount() {
    const { data } = await http.get('/communications/inbox/unread-count');
    return data?.count ?? 0;
  },

  async getSent({ limit = 30, offset = 0 } = {}) {
    const { data } = await http.get('/communications/messages', { params: { limit, offset } });
    return data?.messages || [];
  },

  async getMessage(id) {
    const { data } = await http.get(`/communications/messages/${encodeURIComponent(id)}`);
    return data?.message || null;
  },

  async sendMessage({ messageType, title, body, audienceType, audienceMeta, allowReplies, scheduledFor, attachments }) {
    const { data } = await http.post('/communications/messages', {
      messageType, title, body, audienceType,
      audienceMeta: audienceMeta || {},
      allowReplies: allowReplies || false,
      scheduledFor: scheduledFor || undefined,
      attachments: attachments || [],
    });
    return data;
  },

  async uploadAttachment(formData) {
    const { data } = await http.post('/communications/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getComposeBatches() {
    const { data } = await http.get('/communications/compose/batches');
    return data?.batches || [];
  },

  async getComposeStudents() {
    const { data } = await http.get('/communications/compose/students');
    return data?.students || [];
  },

  async getComposeParents() {
    const { data } = await http.get('/communications/compose/parents');
    return data?.parents || [];
  },

  async getComposeCoaches() {
    const { data } = await http.get('/communications/compose/coaches');
    return data?.coaches || [];
  },
};
