import AxiosClient from "../services/axiosInstance";

export function createLectureComment(commentPayload) {
  return AxiosClient.post('/api/lecture-comments', {
    id: commentPayload.id,
    lectureId: commentPayload.lectureId,
    userId: commentPayload.userId,
    parentId: commentPayload.parentId || null,
    content: commentPayload.content
  })
  .then(response => response.data)
  .catch(error => {
    console.error('Lỗi khi tạo comment:', error);
    throw error;
  });
}

export async function fetchCommentsTree(lectureId) {
  try {
    const response = await AxiosClient.post(
      `/api/lecture-comments/list/${lectureId}`
    );
    // response.data is List<LectureCommentDto>
    return response.data;
  } catch (err) {
    console.error('Failed to load comments tree', err);
    throw err;
  }
}