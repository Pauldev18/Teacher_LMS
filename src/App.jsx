import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from '../src/context/AuthContext'

// Layouts
import DashboardLayout from './layouts/DashboardLayout'

// Pages
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import Courses from './pages/courses/Courses'
import CourseDetail from './pages/courses/CourseDetail'
import CourseForm from './pages/courses/CourseForm'
import ContentManagement from './pages/content/ContentManagement'
import LessonEditor from './pages/content/LessonEditor'
import QuizCreator from './pages/content/QuizCreator'
import Students from './pages/students/Students'
import QA from './pages/qa/QA'
import NotFound from './pages/NotFound'
import QuizEdit from './pages/content/QuizEdit'
import Messages from './pages/Message/Messages'
import VoucherManagement from './pages/voucher/VoucherManagement'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUserLMS, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!currentUserLMS) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route 
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="courses">
            <Route index element={<Courses />} />
            <Route path="new" element={<CourseForm />} />
            <Route path=":courseId" element={<CourseDetail />} />
            <Route path=":courseId/edit" element={<CourseForm />} />
            <Route path=":courseId/content" element={<ContentManagement />} />
            <Route path=":courseId/content/:contentId" element={<LessonEditor />} />
            <Route path=":courseId/quiz/new" element={<QuizCreator />} />
            <Route path=":courseId/quiz/:quizId" element={<QuizCreator />} />
            <Route path=":courseId/quiz/:quizId/edit" element={<QuizEdit />} />
            <Route path=":courseId/students" element={<Students />} />
            <Route path=":courseId/qa" element={<QA />} />
          </Route>
          <Route path="messages" element={<Messages />} />
          <Route path="vouchers" element={<VoucherManagement />} />
        </Route>
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  )
}

export default App
