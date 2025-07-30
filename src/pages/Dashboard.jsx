import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiPlusCircle, FiUsers, FiMessageSquare, FiBook, FiClock } from 'react-icons/fi'
import { fetchCourses, fetchCoursesyInstructor, fetchStats } from '../services/courseService'
import CourseCard from '../components/courses/CourseCard'
import { fetchInstructorStats } from '../services/instructorService'

const Dashboard = () => {
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalMessages: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // In a real app, these would be API calls
        const coursesData = await fetchCoursesyInstructor()
        const statsData = await fetchInstructorStats()
        
        // Only get the 3 most recent courses
        setCourses(coursesData.slice(0, 3))
        setStats(statsData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [])

  const handleActivityClick = (activity) => {
    switch (activity.type) {
      case 'enrollment':
        navigate(`/courses/${activity.courseId}/students`)
        break
      case 'question':
        navigate(`/courses/${activity.courseId}/qa`)
        break
      case 'quiz':
        navigate(`/courses/${activity.courseId}/content`)
        break
      case 'review':
        navigate(`/courses/${activity.courseId}`)
        break
      default:
        navigate(`/courses/${activity.courseId}`)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading dashboard...</div>
      </div>
    )
  }
  
  return (
    <div className="animate-fade-in">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your teaching activities and courses
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/courses/new"
            className="btn btn-primary flex items-center"
          >
            <FiPlusCircle className="mr-2" />
            Create Course
          </Link>
        </div>
      </div>
      
      {/* Stats section */}
    {/* Stats section */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="card flex items-center">
            <div className="bg-primary-100 p-3 rounded-full">
              <FiBook className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>

          <div className="card flex items-center">
            <div className="bg-secondary-100 p-3 rounded-full">
              <FiUsers className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>

          <div className="card flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <FiMessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalRevenue?.toLocaleString('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                })}
              </p>
            </div>
          </div>
        </div>

      
      {/* Recent courses section */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Courses</h2>
      {courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
          <Link to="/courses/new" className="btn btn-primary inline-flex items-center">
            <FiPlusCircle className="mr-2" />
            Create Your First Course
          </Link>
        </div>
      )}
      
      {/* Recent activity section */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div className="card">
      {Array.isArray(stats.recentActivities) && stats.recentActivities.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {stats.recentActivities.map((activity) => (
              <li key={activity.id} className="py-3">
                <div className="flex items-center">
                  <div className="min-w-0 flex-1">
                    <p 
                      className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600"
                      onClick={() => handleActivityClick(activity)}
                    >
                      {activity.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span>{activity.time}</span>
                      {activity.course && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{activity.course}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard