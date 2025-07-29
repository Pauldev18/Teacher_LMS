import { createContext, useState, useEffect } from 'react'
import { LECTURER_DATA } from '../data/mockData'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulate getting user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('lms_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Login function - in a real app, this would validate credentials with an API
  const login = (email, password) => {
    // Simple mock login
    if (email === 'lecturer@example.com' && password === 'password') {
      const userData = { ...LECTURER_DATA, email }
      setUser(userData)
      localStorage.setItem('lms_user', JSON.stringify(userData))
      return { success: true }
    }
    return { success: false, message: 'Invalid credentials' }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem('lms_user')
  }

  const value = {
    user,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}