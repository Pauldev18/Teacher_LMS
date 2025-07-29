import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiLogin, register } from '../services/Auth';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo từ sessionStorage hoặc localStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('lms_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login bằng gọi API 
const login = async (email, password, remember = false) => {
  const user = await apiLogin(email, password);
  if (user) {
    setCurrentUser(user);
    sessionStorage.setItem('lms_user', JSON.stringify(user));
    sessionStorage.setItem('token', user.token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    if (remember) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberEmail', email);
      localStorage.setItem('rememberPassword', password);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberEmail');
      localStorage.removeItem('rememberPassword');
    }

    return true;
  }
  return false;
};


  // Logout và clear session
  const logout = () => {
    setCurrentUser(null);
    
    sessionStorage.removeItem('lms_user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

const signup = async (name, email, password) => {
  try {
    await register(name, email, password); // gọi API backend
    setCurrentUser(null);
    sessionStorage.removeItem('lms_user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    return true; // đăng ký thành công
  } catch (err) {
    console.error("Đăng ký thất bại:", err);
    return false; // đăng ký thất bại
  }
};

  // Đăng ký khóa học (giữ nguyên nếu dùng mock)
  const enrollInCourse = (courseId) => {
    if (!currentUser) return false;
    const updatedUser = {
      ...currentUser,
      enrolledCourses: [...(currentUser.enrolledCourses || []), courseId]
    };
    setCurrentUser(updatedUser);
    sessionStorage.setItem('lms_user', JSON.stringify(updatedUser));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    return true;
  };

  const value = {
    currentUser,
    login,
    logout,
    signup,
    enrollInCourse,
    isEnrolled: (courseId) => currentUser?.enrolledCourses?.includes(courseId),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
