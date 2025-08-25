
import { v4 as uuidv4 } from 'uuid';
import AxiosClient from './axiosInstance';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const fetchCourses = async () => {
  try {
    const res = await AxiosClient.get('/api/courses');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Không tìm thấy khóa học');
  }
};

export const fetchCoursesyInstructor = async () => {
  try {
    const res = await AxiosClient.get('/api/courses/instructor');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Không tìm thấy khóa học');
  }
};
export const fetchCourseContentById = async (contentId) => {
  const response = await AxiosClient.get(`/api/lectures/${contentId}`);
  return response.data;
}
export const fetchCourseById = async (courseId) => {
  try {
    const res = await AxiosClient.get(`/api/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Không tìm thấy khóa học');
  }
};

// Create a new course
export const createCourse = async (courseData, file, instructorId) => {
  try {
    // Dữ liệu course gửi dạng object
    const newCourse = {
      id: uuidv4(),
      title: courseData.title,
      description: courseData.description,
      requirements: courseData.requirements,
      categoryId: parseInt(courseData.category, 10),
      levelId: parseInt(courseData.level, 10),
      price: parseFloat(courseData.price),
      discountPrice: parseFloat(courseData.discountPrice),
      thumbnail: courseData.thumbnail,
      duration: courseData.duration,
      language: courseData.language,
      lastUpdated: new Date().toISOString().split('T')[0], 
      instructorId: instructorId,
      rating: 0,
      numReviews: 0,
      numLectures: 0,
      status: 'DRAFT',
    };
    console.log('Creating course with data:', newCourse);
    // Dùng FormData để gửi cả object lẫn file
    const formData = new FormData();
    formData.append(
      'dto',
      new Blob([JSON.stringify(newCourse)], { type: 'application/json' })
    );
    if (file) {
      formData.append('file', file);
    }

    const res = await AxiosClient.post('/api/courses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

// Update a course
// Update a course
export const updateCourse = async (courseId, courseData, file, instructorId) => {
  try {
    const updatePayload = {
      id: courseId,
      title: courseData.title,
      description: courseData.description,
      requirements: courseData.requirements,
      categoryId: parseInt(courseData.category, 10),
      levelId: parseInt(courseData.level, 10),
      price: parseFloat(courseData.price),
      discountPrice: parseFloat(courseData.discountPrice),
      thumbnail: courseData.thumbnail, // sẽ được BE override nếu có file
      duration: courseData.duration,
      language: courseData.language,
      lastUpdated: new Date().toISOString().split('T')[0],
      instructorId: instructorId, 
      rating: courseData.rating || 0,
      numReviews: courseData.numReviews || 0,
      numLectures: courseData.numLectures || 0,
      status: courseData.status || 'DRAFT'
    };

    const formData = new FormData();
    formData.append(
      'dto',
      new Blob([JSON.stringify(updatePayload)], { type: 'application/json' })
    );
    if (file) {
      formData.append('file', file);
    }

    const res = await AxiosClient.put(`/api/courses/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
     throw err;
  }
};



export const deleteCourse = async (courseId) => {
  try {
    const res = await AxiosClient.delete(`/api/courses/${courseId}`);
    return res.data; 
  } catch (error) {
    throw new Error(error.response?.data || 'Lỗi khi xóa khóa học');
  }
};

// Fetch course content
export const fetchCourseContent = async (courseId) => {
  try {
    // GET /api/courses/{courseId}/contents
    const response = await AxiosClient.get(`/api/courses/${courseId}/contents`);
    // axiosClient tự parse JSON, data chính là List<ContentItemDto>
    return response.data;
  } catch (error) {
    console.error('fetchCourseContent thất bại:', error);
    throw error;
  }
};
// Create course content
export const createCourseContent = async (courseId, contentData) => {
  if (contentData.isChapter) {
    
    // Chuẩn bị payload cho Chapter
    const payload = {
      id: uuidv4(),
      courseId: courseId,
      title: contentData.title,
      description: contentData.description,
      hasQuiz: contentData.hasQuiz,
      sortOrder: 0
    };

    try {
      const response = await AxiosClient.post('/api/chapters', payload);
      return response.data; 
    } catch (error) {
      console.error('Tạo chapter thất bại:', error);
      throw error;
    }
  }

 const formData = new FormData()
  const dataToSend = {
    id: uuidv4(),
    courseId: contentData.courseId,
    chapterId: contentData.chapterId || null,
    title: contentData.title,
    description: contentData.description,
    duration: contentData.duration,
    videoUrl: null,
    sortOrder: 0,
    isDemo: contentData.hasDemo
  }

  formData.append(
    'data',
    new Blob([JSON.stringify(dataToSend)], { type: 'application/json' })
  )

  // Nếu có video thì gửi luôn
  if (contentData.videoFile) {
    formData.append('video', contentData.videoFile)
  }

  const response = await AxiosClient.post('/api/lectures', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
};


export async function updateCourseContent(id, data, videoFile = null) {
  const formData = new FormData();

  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  if (videoFile) {
    formData.append('video', videoFile);
  }

  const res = await AxiosClient.put(`/api/lectures/updateLesson/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
}






// Fetch quiz data
export const fetchQuiz = async (courseId, quizId) => {
  try {
    const response = await AxiosClient.get(`/api/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy quiz:', error);
    throw new Error('Không thể tải quiz');
  }
};

// Create or update a quiz
export const saveQuiz = async (courseId, chapterId, quizData) => {
  try {
    const response = await AxiosClient.post(
      `/api/courses/${courseId}/chapters/${chapterId}/quizzes`,
      quizData
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo quiz:", error);
    throw error;
  }
};
export const updateQuiz = async (courseId, quizId, quizData) => {
  try {
    const response = await AxiosClient.put(
      `/api/courses/${courseId}/chapters/quizzes/${quizId}`,
      quizData
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật quiz:", error);
    throw error;
  }
};
export const deleteQuiz = async (quizId) => {
  try {
    const response = await AxiosClient.delete(`/api/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xoá quiz:", error);
    throw error;
  }
};


export async function fetchStudents(courseId) {
  const res = await AxiosClient.get(`/api/enrollments/course/${courseId}/users`);
  return res.data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    enrolledDate: user.enrolledAt || new Date().toISOString(), 
    progress: user.processLesson,
    lastActive: new Date().toISOString()
  }));
}



export async function hasQuizSubmission(quizId) {
  const res = await AxiosClient.get(`/api/quizzes/${quizId}/has-submission`);
  // API trả về boolean
  return !!res.data;
}