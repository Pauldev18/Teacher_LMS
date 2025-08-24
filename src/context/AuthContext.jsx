import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiLogin, register } from '../services/Auth';


export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUserLMS, setcurrentUserLMS] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo từ sessionStorage hoặc localStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem('lms_user');
    if (storedUser) {
      setcurrentUserLMS(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login bằng gọi API 
const login = async (email, password, remember = false) => {
  let user;
  try {
    user = await apiLogin(email, password);
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại.';
    throw new Error(msg);
  }

  if (!user?.token) throw new Error('Đăng nhập thất bại.');

  setcurrentUserLMS(user);
  sessionStorage.setItem('lms_user', JSON.stringify(user));
  sessionStorage.setItem('token', user.token);
  localStorage.setItem('currentUserLMS', JSON.stringify(user));

  if (remember) {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('rememberEmail', email);
  } else {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberEmail');
  }
  return user;
};


  // Logout và clear session
  const logout = () => {
    setcurrentUserLMS(null);
    
    sessionStorage.removeItem('lms_user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUserLMS');
  };

const signup = async (name, email, password) => {
  try {
    await register(name, email, password); // gọi API backend
    setcurrentUserLMS(null);
    sessionStorage.removeItem('lms_user');
    sessionStorage.removeItem('token');
    localStorage.removeItem('currentUserLMS');
    return true; // đăng ký thành công
  } catch (err) {
    console.error("Đăng ký thất bại:", err);
    return false; // đăng ký thất bại
  }
};

  // Đăng ký khóa học (giữ nguyên nếu dùng mock)
  const enrollInCourse = (courseId) => {
    if (!currentUserLMS) return false;
    const updatedUser = {
      ...currentUserLMS,
      enrolledCourses: [...(currentUserLMS.enrolledCourses || []), courseId]
    };
    setcurrentUserLMS(updatedUser);
    sessionStorage.setItem('lms_user', JSON.stringify(updatedUser));
    localStorage.setItem('currentUserLMS', JSON.stringify(updatedUser));
    return true;
  };

  const value = {
    currentUserLMS,
    login,
    logout,
    signup,
    enrollInCourse,
    isEnrolled: (courseId) => currentUserLMS?.enrolledCourses?.includes(courseId),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
