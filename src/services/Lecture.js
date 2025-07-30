import AxiosClient from "../services/axiosInstance";

export const getLecturesByCourse = async (courseId) => {
  try {
    const response = await AxiosClient.get(`/api/lectures/by-course/${courseId}`);
    return response.data; // List<LectureDTO>
  } catch (error) {
    console.error('Error fetching lectures:', error);
    throw error;
  }
};

export function updateLectureComment(id, newContent) {
  return AxiosClient.put(`/api/lecture-comments/${id}`, { content: newContent }, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.data);
}




export function deleteLectureComment(id) {
  return AxiosClient.delete(`/api/lecture-comments/${id}`);
}


export async function fetchContentList(courseId) {
  try {
    const res = await AxiosClient.get(`/api/courses/${courseId}/listContent`);

    if (Array.isArray(res.data)) {
      return res.data;
    } else {
      console.warn("⚠️ Dữ liệu không phải mảng:", res.data);
      return [];
    }
  } catch (error) {
    console.error("❌ Lỗi khi fetch nội dung khóa học:", error);
    return [];
  }
}