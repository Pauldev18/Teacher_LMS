import AxiosClient from "./axiosInstance";

export async function getMyNotifications(page = 0, size = 20) {
  const res = await AxiosClient.get('/api/notifications', { params: { page, size } });
  return res.data; // Spring Page<Notification>
}

export async function getUnreadCount() {
  const res = await AxiosClient.get('/api/notifications/unread-count');
  return res.data; // number
}

export async function markRead(id) {
  await AxiosClient.patch(`/api/notifications/${id}/read`);
}

export async function markAllRead() {
  const res = await AxiosClient.patch(`/api/notifications/read-all`);
  return res.data; // updated count
}

export async function deleteNotification(id) {
  await AxiosClient.delete(`/api/notifications/${id}`);
}
