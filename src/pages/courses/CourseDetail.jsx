import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  FiEdit2, 
  FiTrash2, 
  FiBookOpen, 
  FiUsers, 
  FiCalendar, 
  FiClock,
  FiChevronRight,
  FiArrowLeft,
  FiShare2,
  FiMessageSquare
} from 'react-icons/fi'
import { fetchCourseById, deleteCourse } from '../../services/courseService'

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true)
        const courseData = await fetchCourseById(courseId)
        setCourse(courseData)
      } catch (error) {
        console.error('Error loading course:', error)
     setError(`Failed to load course data. Please try again. (Lỗi: ${error.message})`);

      } finally {
        setLoading(false)
      }
    }
    
    loadCourse()
  }, [courseId])
  
  const handleDelete = async () => {
    try {
      await deleteCourse(courseId)
      navigate('/courses')
    } catch (error) {
      console.error('Error deleting course:', error)
      setError('Failed to delete course. Please try again.', error)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading course details...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Course not found</h2>
        <p className="mt-2 text-gray-500">The course you're looking for doesn't exist or has been removed.</p>
        <Link to="/courses" className="btn btn-primary mt-4">
          Back to Courses
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back to Courses
      </button>
      
      {/* Course header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Course image */}
        <div className="md:w-1/3">
          <div 
            className="aspect-video bg-cover bg-center rounded-lg shadow-md w-full"
            style={{ backgroundImage: `url(${course.image || 'https://images.pexels.com/photos/5428003/pexels-photo-5428003.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'})` }}
          >
           <div className="h-full w-full bg-black bg-opacity-30 rounded-lg flex items-end p-4">
            <span
              className={`badge ${
                course.status === 'PUBLISHED'
                  ? 'bg-green-100 text-green-800'
                  : course.status === 'DRAFT'
                  ? 'bg-yellow-100 text-yellow-800'
                  : course.status === 'ARCHIVED'
                  ? 'bg-gray-200 text-gray-800'
                  : course.status === 'DISABLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {course.status}
            </span>
          </div>

          </div>
        </div>
        
        {/* Course info */}
        <div className="md:w-2/3">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-2">{course.title}</h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <FiUsers className="mr-1" />
              <span>{course.numStudents} students</span>
            </div>
            <div className="flex items-center">
              <FiBookOpen className="mr-1" />
              <span>{course.numLectures} lessons</span>
            </div>
            <div className="flex items-center">
              <FiClock className="mr-1" />
              <span>{course.duration || 'Not specified'}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-1" />
              <span>Updated {new Date(course.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="prose prose-sm mb-4" dangerouslySetInnerHTML={{ __html: course.description }} />
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to={`/courses/${courseId}/edit`} className="btn btn-outline flex items-center">
              <FiEdit2 className="mr-2" />
              Edit Course
            </Link>
            <Link to={`/courses/${courseId}/content`} className="btn btn-primary flex items-center">
              <FiBookOpen className="mr-2" />
              Manage Content
            </Link>
            <Link to={`/courses/${courseId}/students`} className="btn btn-outline flex items-center">
              <FiUsers className="mr-2" />
              View Students
            </Link>
            <button className="btn btn-outline flex items-center">
              <FiShare2 className="mr-2" />
              Share
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)} 
              className="btn btn-danger flex items-center"
            >
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
      
      {/* Course sections */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <FiBookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Course Content</h3>
            <p className="text-gray-600 mb-4">Create and organize your lessons, quizzes, and materials</p>
            <Link 
              to={`/courses/${courseId}/content`}
              className="inline-flex items-center text-primary-600 hover:text-primary-700"
            >
              Manage Content
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Students</h3>
            <p className="text-gray-600 mb-4">View and manage enrolled students and their progress</p>
            <Link 
              to={`/courses/${courseId}/students`}
              className="inline-flex items-center text-secondary-600 hover:text-secondary-700"
            >
              View Students
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mb-4">
              <FiMessageSquare className="h-6 w-6 text-accent-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Q&A</h3>
            <p className="text-gray-600 mb-4">Answer student questions and provide additional help</p>
            <Link 
              to={`/courses/${courseId}/qa`}
              className="inline-flex items-center text-accent-600 hover:text-accent-700"
            >
              View Questions
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Course</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{course.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetail