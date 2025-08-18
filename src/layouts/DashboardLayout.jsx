// src/layouts/DashboardLayout.jsx
import { useState, useMemo } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Header from "../components/common/Header"
import Sidebar from "../components/common/Sidebar"
import { useAuth } from "../context/AuthContext"
import useNotificationSocket from "../services/useNotificationSocket"
import { markRead } from "../services/notificationService"

function getChatIdFromLink(link) {
  if (!link) return null
  try {
    const url = new URL(link, window.location.origin)
    return url.searchParams.get("chatId")
  } catch {
    return null
  }
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { currentUserLMS } = useAuth()
  const userId = currentUserLMS?.id

  const location = useLocation()
  const navigate = useNavigate()
  const { pathname, search } = location

  const currentChatId = useMemo(() => {
    const sp = new URLSearchParams(search)
    return sp.get("chatId")
  }, [search])

  const isOnMessagesPage = pathname.startsWith("/messages")

  useNotificationSocket({
    userId,
    onMessage: (notif) => {
      const notifChatId = getChatIdFromLink(notif?.link)
      const isSameOpenChat =
        notif?.type === "MESSAGE" &&
        isOnMessagesPage &&
        notifChatId &&
        notifChatId === currentChatId

      if (isSameOpenChat) {
        // 1) Không show toast
        // 2) Đánh dấu đã đọc nếu có id
        if (notif?.id) {
          markRead(notif.id).catch((e) => console.error("markRead fail:", e))
        }
        return
      }

      // Không cùng phòng chat đang mở -> xử lý như noti bình thường
      setUnreadCount((c) => c + 1)

      const title = notif?.title || "Thông báo mới"
      const body  = notif?.body || ""

      // khi người dùng click toast -> điều hướng tới link và mark read
      const t = toast.info(`${title}${body ? `: ${body}` : ""}`, {
        autoClose: 3500,
        onClick: () => {
          if (notif?.link) navigate(notif.link)
          if (notif?.id) {
            markRead(notif.id)
              .then(() => window.dispatchEvent(new Event("app:reloadNotifications")))
              .catch((e) => console.error("markRead onClick fail:", e))
          }
        },
      })

      window.dispatchEvent(new CustomEvent("app:newNotification", { detail: notif, toastId: t }))
    },
  })

  const toggleSidebar = () => setSidebarOpen((v) => !v)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          toggleSidebar={toggleSidebar}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
