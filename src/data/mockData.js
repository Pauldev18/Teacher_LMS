// Mock data for the lecturer portal
// In a real app, this would come from an API

export const LECTURER_DATA = {
  id: 'lec_123456',
  name: 'Dr. Sarah Johnson',
  email: 'lecturer@example.com',
  avatar: null,
  department: 'Computer Science',
  role: 'Senior Lecturer'
}

// Course statuses
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
}

// Content types
export const CONTENT_TYPES = {
  CHAPTER: 'chapter',
  LESSON: 'lesson',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment'
}

// Quiz question types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  MULTIPLE_SELECT: 'multiple_select',
  MATCHING: 'matching'
}

// Sample courses data
export const COURSES_DATA = [
  {
    id: 'course_1',
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. This course covers everything you need to know to build your first website.',
    image: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    published: true,
    createdAt: '2023-09-15T10:00:00Z',
    updatedAt: '2023-11-22T15:30:00Z',
    studentsCount: 124,
    lessonsCount: 18,
    duration: '8 weeks',
    level: 'Beginner'
  },
  {
    id: 'course_2',
    title: 'Advanced JavaScript Concepts',
    description: 'Dive deep into advanced JavaScript concepts including closures, prototypes, async programming, and modern ES6+ features.',
    image: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    published: true,
    createdAt: '2023-08-05T09:15:00Z',
    updatedAt: '2023-12-01T11:45:00Z',
    studentsCount: 87,
    lessonsCount: 14,
    duration: '6 weeks',
    level: 'Intermediate'
  },
  {
    id: 'course_3',
    title: 'React.js Masterclass',
    description: 'Master React.js with practical examples and real-world projects. Learn hooks, context API, Redux, and performance optimization.',
    image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    published: false,
    createdAt: '2023-11-01T14:20:00Z',
    updatedAt: '2023-12-10T09:10:00Z',
    studentsCount: 0,
    lessonsCount: 10,
    duration: '10 weeks',
    level: 'Advanced'
  }
]

// Recent activities for dashboard
export const ACTIVITIES_DATA = [
  {
    id: 'act_1',
    type: 'enrollment',
    description: 'New student enrolled in your course',
    time: '2 hours ago',
    course: 'Introduction to Web Development',
    courseId: 'course_1'
  },
  {
    id: 'act_2',
    type: 'question',
    description: 'New question in lesson 3: "How do CSS selectors work?"',
    time: '5 hours ago',
    course: 'Introduction to Web Development',
    courseId: 'course_1'
  },
  {
    id: 'act_3',
    type: 'quiz',
    description: 'Quiz 2 results ready for review',
    time: '1 day ago',
    course: 'Advanced JavaScript Concepts',
    courseId: 'course_2'
  },
  {
    id: 'act_4',
    type: 'review',
    description: 'New 5-star review from student',
    time: '2 days ago',
    course: 'Introduction to Web Development',
    courseId: 'course_1'
  }
]

// Course content structure
export const COURSE_CONTENTS = {
  'course_1': [
    {
      id: 'chapter_1',
      type: CONTENT_TYPES.CHAPTER,
      title: 'Getting Started with HTML',
      description: 'Learn the basics of HTML structure and elements',
      order: 1,
      children: [
        {
          id: 'lesson_1',
          type: CONTENT_TYPES.LESSON,
          title: 'HTML Document Structure',
          description: 'Understanding the basic structure of HTML documents',
          duration: '15 mins',
          order: 1
        },
        {
          id: 'lesson_2',
          type: CONTENT_TYPES.LESSON,
          title: 'HTML Elements and Attributes',
          description: 'Working with common HTML elements and their attributes',
          duration: '20 mins',
          order: 2
        },
        {
          id: 'quiz_1',
          type: CONTENT_TYPES.QUIZ,
          title: 'HTML Basics Quiz',
          description: 'Test your knowledge of basic HTML concepts',
          questionCount: 5,
          order: 3
        }
      ]
    },
    {
      id: 'chapter_2',
      type: CONTENT_TYPES.CHAPTER,
      title: 'CSS Fundamentals',
      description: 'Master the basics of CSS styling',
      order: 2,
      children: [
        {
          id: 'lesson_3',
          type: CONTENT_TYPES.LESSON,
          title: 'CSS Selectors',
          description: 'Learn about different types of CSS selectors',
          duration: '25 mins',
          order: 1
        },
        {
          id: 'lesson_4',
          type: CONTENT_TYPES.LESSON,
          title: 'Box Model and Layout',
          description: 'Understanding the CSS box model and basic layouts',
          duration: '30 mins',
          order: 2
        }
      ]
    }
  ]
}

// Mock student data for course enrollment
export const STUDENTS_DATA = {
  'course_1': [
    {
      id: 'student_1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      enrolledDate: '2023-10-05T10:30:00Z',
      progress: 65,
      lastActive: '2023-12-15T14:20:00Z'
    },
    {
      id: 'student_2',
      name: 'Maya Patel',
      email: 'maya.p@example.com',
      enrolledDate: '2023-10-08T09:15:00Z',
      progress: 78,
      lastActive: '2023-12-16T11:40:00Z'
    },
    {
      id: 'student_3',
      name: 'Carlos Rodriguez',
      email: 'carlos.r@example.com',
      enrolledDate: '2023-10-10T16:45:00Z',
      progress: 42,
      lastActive: '2023-12-10T08:30:00Z'
    },
    {
      id: 'student_4',
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      enrolledDate: '2023-10-15T11:20:00Z',
      progress: 91,
      lastActive: '2023-12-16T19:15:00Z'
    }
  ],
  'course_2': [
    {
      id: 'student_5',
      name: 'Daniel Lee',
      email: 'daniel.l@example.com',
      enrolledDate: '2023-09-20T13:10:00Z',
      progress: 82,
      lastActive: '2023-12-15T10:25:00Z'
    },
    {
      id: 'student_6',
      name: 'Sophia Chen',
      email: 'sophia.c@example.com',
      enrolledDate: '2023-09-22T08:30:00Z',
      progress: 54,
      lastActive: '2023-12-05T16:40:00Z'
    },
    {
      id: 'student_2',
      name: 'Maya Patel',
      email: 'maya.p@example.com',
      enrolledDate: '2023-09-25T15:45:00Z',
      progress: 67,
      lastActive: '2023-12-14T14:30:00Z'
    }
  ]
}

// Q&A data
export const QA_DATA = {
  'course_1': [
    {
      id: 'question_1',
      studentId: 'student_2',
      studentName: 'Maya Patel',
      contentId: 'lesson_3',
      contentTitle: 'CSS Selectors',
      question: 'I\'m confused about the difference between class and ID selectors. Could you explain when to use each one?',
      timestamp: '2023-12-10T09:30:00Z',
      answered: true,
      answer: 'Great question, Maya! Class selectors (using .className) are for styling multiple elements that share common characteristics. ID selectors (using #idName) are for unique elements that appear only once on a page. Use classes for reusable styles and IDs for unique elements or JavaScript hooks.',
      answerTimestamp: '2023-12-10T11:45:00Z'
    },
    {
      id: 'question_2',
      studentId: 'student_1',
      studentName: 'Alex Johnson',
      contentId: 'lesson_2',
      contentTitle: 'HTML Elements and Attributes',
      question: 'What\'s the best practice for organizing semantic HTML for accessibility?',
      timestamp: '2023-12-14T15:20:00Z',
      answered: false,
      answer: null,
      answerTimestamp: null
    }
  ],
  'course_2': [
    {
      id: 'question_3',
      studentId: 'student_5',
      studentName: 'Daniel Lee',
      contentId: 'lesson_js_1',
      contentTitle: 'Advanced Closures',
      question: 'I\'m having trouble understanding lexical environment in closures. Could you provide an example of how this works in practice?',
      timestamp: '2023-12-05T10:15:00Z',
      answered: true,
      answer: 'Absolutely, Daniel. Lexical environment refers to the scope in which a function was defined. Here\'s a practical example: [code example]. The inner function has access to variables from its lexical environment (the outer function) even after the outer function has completed execution.',
      answerTimestamp: '2023-12-05T14:30:00Z'
    }
  ]
}

// Quiz data
export const QUIZ_DATA = {
  'quiz_1': {
    id: 'quiz_1',
    title: 'HTML Basics Quiz',
    description: 'Test your knowledge of basic HTML concepts covered in this chapter.',
    timeLimit: 15, // in minutes
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        question: 'Which HTML element is used to define the title of a document?',
        options: [
          { id: 'a', text: '<header>' },
          { id: 'b', text: '<title>' },
          { id: 'c', text: '<heading>' },
          { id: 'd', text: '<meta>' }
        ],
        correctAnswer: 'b',
        points: 1
      },
      {
        id: 'q2',
        type: QUESTION_TYPES.TRUE_FALSE,
        question: 'HTML stands for Hyper Text Markup Language.',
        correctAnswer: true,
        points: 1
      },
      {
        id: 'q3',
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        question: 'Which attribute is used to define inline styles?',
        options: [
          { id: 'a', text: 'class' },
          { id: 'b', text: 'styles' },
          { id: 'c', text: 'style' },
          { id: 'd', text: 'font' }
        ],
        correctAnswer: 'c',
        points: 1
      },
      {
        id: 'q4',
        type: QUESTION_TYPES.MULTIPLE_CHOICE,
        question: 'Which HTML element is used to define an unordered list?',
        options: [
          { id: 'a', text: '<ol>' },
          { id: 'b', text: '<list>' },
          { id: 'c', text: '<ul>' },
          { id: 'd', text: '<dl>' }
        ],
        correctAnswer: 'c',
        points: 1
      },
      {
        id: 'q5',
        type: QUESTION_TYPES.MULTIPLE_SELECT,
        question: 'Which of the following are valid HTML5 semantic elements?',
        options: [
          { id: 'a', text: '<header>' },
          { id: 'b', text: '<nav>' },
          { id: 'c', text: '<content>' },
          { id: 'd', text: '<article>' },
          { id: 'e', text: '<section>' }
        ],
        correctAnswers: ['a', 'b', 'd', 'e'],
        points: 2
      }
    ]
  }
}

// Stats for dashboard
export const STATS_DATA = {
  totalStudents: 145,
  totalCourses: 3,
  totalMessages: 5,
  recentActivities: ACTIVITIES_DATA
}