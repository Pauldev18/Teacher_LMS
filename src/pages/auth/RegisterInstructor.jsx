// src/pages/RegisterInstructor.jsx
import React, { useState } from 'react';
import { FaTwitter, FaLinkedin, FaYoutube, FaGlobe } from "react-icons/fa";
import AxiosClient from '../../services/axiosInstance';
import SkillsInput from './SkillsInput';
import { Link, useNavigate } from 'react-router-dom';

const RegisterInstructor = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    bio: '',
    website: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    expertises: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
            const res = await AxiosClient.post('/api/auth/register-instructor', form);
            const { success, message } = res.data; 

            if (success === true) {
                setMessage('🎉 Đăng ký giảng viên thành công!');
                navigate('/login');
            } else {
                setMessage(`⚠️ ${message || 'Email đã tồn tại hoặc lỗi đăng ký!'}`);
            }
            } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'Có lỗi xảy ra!';
            setMessage(`❌ ${msg}`);
            } finally {
            setLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
        
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-2">
          Đăng ký Giảng viên
        </h1>
        <p className="text-center text-gray-500 mb-8">Chia sẻ kiến thức, truyền cảm hứng 🚀</p>

        {message && (
          <div className="mb-4 p-3 rounded-lg text-center font-medium 
                          bg-blue-50 text-blue-700 animate-fade-in">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <input type="text" name="name" placeholder="Tên đầy đủ" 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.name} onChange={handleChange} required />

          {/* Email */}
          <input type="email" name="email" placeholder="Email" 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.email} onChange={handleChange} required />

          {/* Password */}
          <input type="password" name="password" placeholder="Mật khẩu" 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.password} onChange={handleChange} required />

          {/* Title */}
          <input type="text" name="title" placeholder="Chức danh (VD: Giảng viên Java)" 
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            value={form.title} onChange={handleChange} />

          {/* Bio */}
          <textarea name="bio" placeholder="Giới thiệu ngắn gọn về bạn..." rows="3"
            className="md:col-span-2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
            value={form.bio} onChange={handleChange}></textarea>

          {/* Website */}
          <div className="flex items-center gap-2">
            <FaGlobe className="text-gray-400" />
            <input type="text" name="website" placeholder="Website cá nhân" 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.website} onChange={handleChange} />
          </div>

          {/* Twitter */}
          <div className="flex items-center gap-2">
            <FaTwitter className="text-blue-400" />
            <input type="text" name="twitter" placeholder="Twitter" 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              value={form.twitter} onChange={handleChange} />
          </div>

          {/* LinkedIn */}
          <div className="flex items-center gap-2">
            <FaLinkedin className="text-blue-600" />
            <input type="text" name="linkedin" placeholder="LinkedIn" 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              value={form.linkedin} onChange={handleChange} />
          </div>

          {/* YouTube */}
          <div className="flex items-center gap-2">
            <FaYoutube className="text-red-500" />
            <input type="text" name="youtube" placeholder="YouTube" 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
              value={form.youtube} onChange={handleChange} />
          </div>

          {/* Expertises */}
         <SkillsInput
            value={form.expertises}                  
            onChange={(val) => setForm({ ...form, expertises: val })}
            />

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="md:col-span-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-xl transition-all">
            {loading ? "⏳ Đang đăng ký..." : "✨ Đăng ký ngay"}
          </button>
        </form>
          <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản giảng viên?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 underline">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterInstructor;
