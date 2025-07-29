import axiosClient from './axiosInstance';
export const updateChapterSortOrders = async (chapter) => {
  // Chỉ lấy id và sortOrder (hoặc order nếu FE đang dùng order)
  const body = chapter.map(l => ({
    id: l.id,
    sortOrder: l.sortOrder 
  }));

  try {
    const response = await axiosClient.patch(
      '/api/chapters/update-sort-orders',
      body, 
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
export const fetchChapterById = async (
  chapterId
) => {
  try {
    const res = await axiosClient.get(
      `/api/chapters/${chapterId}`
    );
    return res.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || 'Không tìm thấy chương'
    );
  }
};

export const updateChapter = async (chapter) => {
    const body = {
    title: chapter.title,
    description: chapter.description,
    hasQuiz: chapter.hasQuiz,
    id: chapter.courseId,
  };
  try {
    const response = await axiosClient.put(
      `/api/chapters/${chapter.contentId}`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Cập nhật chương thành công:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật chương:', error);
    throw error;
  }
};
