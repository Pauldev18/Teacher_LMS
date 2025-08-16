import { Link } from 'react-router-dom'
import { FiUsers, FiBookOpen, FiCalendar } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import DescriptionPreview from '../Utils/DescriptionPreview';
import ReactQuill from 'react-quill'

const CourseCard = ({ course }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow group">
      <div 
        className="h-32 bg-cover bg-center rounded-t-lg -mx-6 -mt-6 mb-4" 
        style={{ backgroundImage: `url(${course.thumbnail})` }}
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
      
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        <Link to={`/courses/${course.id}`} className="hover:text-primary-600">
          {course.title}
        </Link>
      </h3>
      
<DescriptionPreview description={course.description} />


      
      <div className="flex flex-wrap justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <FiUsers className="mr-1" />
          <span>{course.numStudents} students</span>
        </div>
        <div className="flex items-center">
          <FiBookOpen className="mr-1" />
          <span>{course.numLectures} lessons</span>
        </div>
        <div className="flex items-center">
          <FiCalendar className="mr-1" />
          <span>Updated {formatDistanceToNow(new Date(course.lastUpdated), { addSuffix: true })}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
        <Link
          to={`/courses/${course.id}`}
          className="btn btn-outline btn-sm"
        >
          View Details
        </Link>
        
        <Link
          to={`/courses/${course.id}/content`}
          className="btn btn-primary btn-sm"
        >
          Manage Content
        </Link>
      </div>
    </div>
  )
}

export default CourseCard