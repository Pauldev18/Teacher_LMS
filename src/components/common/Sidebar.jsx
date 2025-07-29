import { NavLink } from 'react-router-dom'
import { FiHome, FiBook, FiMessageSquare } from 'react-icons/fi'
import { FiX } from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  // Navigation links
  const navLinks = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'My Courses', path: '/courses', icon: FiBook },
    { name: 'Messages', path: '/messages', icon: FiMessageSquare }
  ]
  
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <h2 className="text-xl font-bold text-primary-600">EduTeach LMS</h2>
          <button 
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 md:hidden"
          >
            <span className="sr-only">Close sidebar</span>
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-5 px-2 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => `
                group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors
                ${isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <link.icon 
                className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-500"
              />
              {link.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar