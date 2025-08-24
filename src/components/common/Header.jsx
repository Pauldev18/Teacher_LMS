import { useNavigate } from 'react-router-dom'
import { FiMenu, FiBell, FiUser, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import NotificationBell from './NotificationBell'

const Header = ({ toggleSidebar }) => {
  const { currentUserLMS, logout } = useAuth()
  const navigate = useNavigate()
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropdownRef = useRef()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Đóng dropdown nếu click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left */}
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <FiMenu className="h-6 w-6" />
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center relative" ref={dropdownRef}>
           <div className="p-2 rounded-full text-gray-400 hover:text-gray-500">
            <span className="sr-only">View notifications</span>
            <NotificationBell />
          </div>


            <div className="ml-3 relative">
              <button
                onClick={() => setOpenDropdown((prev) => !prev)}
                className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <FiUser className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block truncate max-w-[150px]">
                  {currentUserLMS?.name || 'Lecturer'}
                </span>
              </button>

              {/* Dropdown */}
              {openDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium truncate">{currentUserLMS?.name}</p>
                    <p className="text-gray-500 text-sm truncate max-w-[200px]">{currentUserLMS?.email}</p>
                  </div>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
