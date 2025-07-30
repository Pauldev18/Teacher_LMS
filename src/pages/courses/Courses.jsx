import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiPlusCircle, FiSearch, FiFilter } from 'react-icons/fi'
import { fetchCourses, fetchCoursesyInstructor } from '../../services/courseService'
import CourseCard from '../../components/courses/CourseCard'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await fetchCoursesyInstructor()
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading courses:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCourses()
  }, [])
  
  // Filter courses based on search and status filter
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'published' && course.published) || 
      (filterStatus === 'draft' && !course.published)
    
    return matchesSearch && matchesFilter
  })
  
  return (
    <div className="animate-fade-in">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">My Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all your courses and learning content
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
      
      {/* Search and filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="form-input pl-10 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Courses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-primary-500">Loading courses...</div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-10">
          {courses.length === 0 ? (
            <>
              <p className="text-gray-500 mb-4">You haven't created any courses yet</p>
              <Link to="/courses/new" className="btn btn-primary inline-flex items-center">
                <FiPlusCircle className="mr-2" />
                Create Your First Course
              </Link>
            </>
          ) : (
            <p className="text-gray-500">No courses found. Try adjusting your search or filters.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Courses