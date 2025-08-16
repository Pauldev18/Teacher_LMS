import AxiosClient from "./axiosInstance";


export const getMessages = (chatId) => AxiosClient.get(`/api/messages/with/${chatId}`);


export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return AxiosClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};


export const getAllUsers = (currentUserId) =>
  AxiosClient.get(`/api/users?currentUserId=${currentUserId}`);

export const getAllUsersByInstructor = () =>
  AxiosClient.get(`/api/enrollments/instructor/students`);

export async function createOrGetChat(user1Id, user2Id) {
  try {
    const res = await AxiosClient.post(`/api/messages/createOrGet`, {
      user1Id,
      user2Id,
    });
    return res.data.chatId; // chatId trả về từ backend
  } catch (err) {
    console.error("❌ Không thể tạo hoặc lấy chat:", err);
    throw err;
  }
}

export function getChatById(chatId) {
  return AxiosClient.get(`/api/messages/${chatId}`);
}

export function getMessagesByChatId(chatId) {
  return AxiosClient.get(`/api/messages/${chatId}/messages`);
}