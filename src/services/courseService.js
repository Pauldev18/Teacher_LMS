
import axiosClient from './axiosInstance';
import { v4 as uuidv4 } from 'uuid';
import { 
  COURSES_DATA,
  COURSE_CONTENTS,
  STUDENTS_DATA,
  QA_DATA,
  STATS_DATA,
  QUIZ_DATA
} from '../data/mockData';
import { id } from 'date-fns/locale';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all courses for the lecturer
export const fetchCourses = async () => {
  try {
    const res = await axiosClient.get('/api/courses');
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Không tìm thấy khóa học');
  }
};
export const fetchCourseContentById = async (contentId) => {
  const response = await axiosClient.get(`/api/lectures/${contentId}`);
  return response.data;
}
export const fetchCourseById = async (courseId) => {
  try {
    const res = await axiosClient.get(`/api/courses/${courseId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Không tìm thấy khóa học');
  }
};

// Create a new course
export const createCourse = async (courseData) => {
  try {
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
      instructorId: 'instructor_001', 
      rating: 0,
      numReviews: 0,
      numLectures: 0,
      status: 'DRAFT',
    };

    const res = await axiosClient.post('/api/courses', newCourse);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data || 'Lỗi khi tạo khóa học');
  }
};

// Update an existing course
export const updateCourse = async (courseId, courseData) => {
  await delay(800);
  const courseIndex = COURSES_DATA.findIndex(course => course.id === courseId);
  if (courseIndex === -1) {
    throw new Error('Course not found');
  }
  
  const updatedCourse = {
    ...COURSES_DATA[courseIndex],
    ...courseData,
    updatedAt: new Date().toISOString()
  };
  
  // Update in mock data
  COURSES_DATA[courseIndex] = updatedCourse;
  return updatedCourse;
};

export const deleteCourse = async (courseId) => {
  try {
    const res = await axiosClient.delete(`/api/courses/${courseId}`);
    return res.data; 
  } catch (error) {
    throw new Error(error.response?.data || 'Lỗi khi xóa khóa học');
  }
};

// Fetch course content
export const fetchCourseContent = async (courseId) => {
  try {
    // GET /api/courses/{courseId}/contents
    const response = await axiosClient.get(`/api/courses/${courseId}/contents`);
    // axiosClient tự parse JSON, data chính là List<ContentItemDto>
    return response.data;
  } catch (error) {
    console.error('fetchCourseContent thất bại:', error);
    throw error;
  }
};
// Create course content
export const createCourseContent = async (courseId, contentData) => {
  // Nếu là chapter thì gọi API backend
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
      const response = await axiosClient.post('/api/chapters', payload);
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

  const response = await axiosClient.post('/api/lectures', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
};


// Update course content
export const updateCourseContent = async (courseId, contentId, contentData) => {
  await delay(600);
  
  if (!COURSE_CONTENTS[courseId]) {
    throw new Error('Course content not found');
  }
  
  const contentIndex = COURSE_CONTENTS[courseId].findIndex(
    content => content.id === contentId
  );
  
  if (contentIndex === -1) {
    throw new Error('Content item not found');
  }
  
  const updatedContent = {
    ...COURSE_CONTENTS[courseId][contentIndex],
    ...contentData
  };
  
  COURSE_CONTENTS[courseId][contentIndex] = updatedContent;
  return updatedContent;
};

// Fetch students for a course
export const fetchStudents = async (courseId) => {
  await delay(700);
  return STUDENTS_DATA[courseId] || [];
};

// Fetch Q&A for a course
export const fetchQA = async (courseId) => {
  await delay(600);
  return QA_DATA[courseId] || [];
};

// Submit answer to a question
export const answerQuestion = async (courseId, questionId, answer) => {
  await delay(800);
  
  if (!QA_DATA[courseId]) {
    throw new Error('Course Q&A not found');
  }
  
  const questionIndex = QA_DATA[courseId].findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error('Question not found');
  }
  
  const updatedQuestion = {
    ...QA_DATA[courseId][questionIndex],
    answer,
    answered: true,
    answerTimestamp: new Date().toISOString()
  };
  
  QA_DATA[courseId][questionIndex] = updatedQuestion;
  return updatedQuestion;
};

// Fetch quiz data
export const fetchQuiz = async (courseId, quizId) => {
  try {
    const response = await axiosClient.get(`/api/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy quiz:', error);
    throw new Error('Không thể tải quiz');
  }
};

// Create or update a quiz
export const saveQuiz = async (courseId, chapterId, quizData) => {
  try {
    const response = await axiosClient.post(
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
    const response = await axiosClient.put(
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
    const response = await axiosClient.delete(`/api/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xoá quiz:", error);
    throw error;
  }
};

// Fetch dashboard stats
export const fetchStats = async () => {
  await delay(900);
  return { ...STATS_DATA };
};