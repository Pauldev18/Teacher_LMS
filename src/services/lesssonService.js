import axiosClient from './axiosInstance';
export const updateLectureSortOrders = async (lectures) => {
  // Chỉ lấy id và sortOrder (hoặc order nếu FE đang dùng order)
  const body = lectures.map(l => ({
    id: l.id,
    sortOrder: l.sortOrder 
  }));

  try {
    const response = await axiosClient.patch(
      '/api/lectures/update-sort-orders',
      body, // Truyền body đã chuẩn hóa
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Update thành công:', response.data);
  } catch (error) {
    console.error('❌ Lỗi khi update sortOrder:', error);
  }
};

export const deleteLecture = async (id) => {
  try {
    await axiosClient.delete(`/api/lectures/${id}`);
    console.log('✅ Xoá lecture thành công:', id);
    // Có thể return true để FE biết xoá ok
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi xoá lecture:', error);
    return false;
  }
};