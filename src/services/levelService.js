import axiosClient from './axiosInstance';

// Lấy tất cả levels
export const fetchLevels = async () => {
  const res = await axiosClient.get('/api/levels');
  return res.data;
};

// Lấy level theo ID
export const getLevelById = async (id) => {
  const res = await axiosClient.get(`/levels/${id}`);
  return res.data;
};

// Thêm level mới
export const createLevel = async (data) => {
  const res = await axiosClient.post('/levels', data);
  return res.data;
};

// Cập nhật level
export const updateLevel = async (id, data) => {
  const res = await axiosClient.put(`/levels/${id}`, data);
  return res.data;
};

// Xóa level
export const deleteLevel = async (id) => {
  const res = await axiosClient.delete(`/levels/${id}`);
  return res.data;
};
