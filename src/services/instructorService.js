import AxiosClient from '../services/axiosInstance';

export async function fetchInstructorStats() {
  try {
    const res = await AxiosClient.get('/api/instructors/me/stats');
    return res.data;
  } catch (err) {
    console.error("Lỗi khi lấy thống kê giảng viên:", err);
    throw err;
  }
}
