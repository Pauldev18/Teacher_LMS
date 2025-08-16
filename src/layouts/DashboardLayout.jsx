// src/layouts/DashboardLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'react-toastify'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'
import { useAuth } from '../context/AuthContext'
import useNotificationSocket from '../services/useNotificationSocket'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { currentUserLMS } = useAuth()
  const userId = currentUserLMS?.id

  useNotificationSocket({
    userId,
    onMessage: (notif) => {
      setUnreadCount((c) => c + 1)
      const title = notif?.title || 'Thông báo mới'
      const body  = notif?.body || ''
      window.dispatchEvent(new CustomEvent('app:newNotification', { detail: notif }))
    },
  })

  const toggleSidebar = () => setSidebarOpen((v) => !v)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
