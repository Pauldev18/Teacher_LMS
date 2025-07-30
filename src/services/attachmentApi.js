import AxiosClient from '../services/axiosInstance';

// 1. Lấy danh sách attachment theo lectureId
export const getAttachmentsByLectureId = async (lectureId) => {
  const res = await AxiosClient.get(`/api/attachments/lecture/${lectureId}`);
  return res.data;
};

// 2. Upload attachment mới
export const uploadAttachment = async ({ lectureId, name, file }) => {
  const formData = new FormData();
  formData.append('lectureId', lectureId);
  formData.append('name', name);
  formData.append('file', file);

  const res = await AxiosClient.post(`/api/attachments/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// 3. Xoá attachment theo ID
export const deleteAttachment = async (attachmentId) => {
  const res = await AxiosClient.delete(`/api/attachments/${attachmentId}`);
  return res.data;
};
