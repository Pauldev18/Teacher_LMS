import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'  
import { useForm } from 'react-hook-form'
import { FiLock } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm()
  
  const onSubmit = async (data) => {
    setError('')
    try {
      const isSuccess = await login(data.email, data.password)
      if (isSuccess) {
        navigate('/')
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.')
      }
    } catch (err) {
      console.error(err)
      setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-card">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">EduTeach LMS</h1>
          <h2 className="mt-2 text-xl font-medium text-gray-900">Cổng thông tin giảng viên</h2>
          <p className="mt-2 text-sm text-gray-600">Đăng nhập để truy cập bảng điều khiển giảng dạy của bạn</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiLock className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-md -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="form-label">Địa chỉ email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder="Địa chỉ email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: 'Please enter a valid email'
                  }
                })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                placeholder="Mật khẩu"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Lưu đăng nhập
              </label>
            </div>
            
            <div className="text-sm">
              <a href="/forgot" className="font-medium text-primary-600 hover:text-primary-500">
                Quên mật khẩu?
              </a>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full flex justify-center"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>

     
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
