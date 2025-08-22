import AxiosClient from "./axiosInstance";

// Lấy tất cả levels
export const fetchLevels = async () => {
  const res = await AxiosClient.get('/api/levels');
   return res.data.filter(level => level.isActive);
};

// Lấy level theo ID
export const getLevelById = async (id) => {
  const res = await AxiosClient.get(`/levels/${id}`);
  return res.data;
};

// Thêm level mới
export const createLevel = async (data) => {
  const res = await AxiosClient.post('/levels', data);
  return res.data;
};

// Cập nhật level
export const updateLevel = async (id, data) => {
  const res = await AxiosClient.put(`/levels/${id}`, data);
  return res.data;
};

// Xóa level
export const deleteLevel = async (id) => {
  const res = await AxiosClient.delete(`/levels/${id}`);
  return res.data;
};
