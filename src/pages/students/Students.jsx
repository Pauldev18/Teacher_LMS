// src/pages/course/Students.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiDownload, FiMail, FiArrowLeft,
  FiCalendar, FiClock, FiExternalLink
} from 'react-icons/fi';
import { fetchCourseById, fetchStudents } from '../../services/courseService';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import 'react-quill/dist/quill.snow.css'; // CSS cho editor
import AdminSendHtmlMailModal from './AdminSendHtmlMailModal';



// ================================== Page Students ==================================
export default function Students() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);          // dữ liệu gốc
  const [viewStudents, setViewStudents] = useState([]);  // sau filter + sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');          // name | progress | enrolledDate | lastActive
  const [sortOrder, setSortOrder] = useState('asc');     // asc | desc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // chọn người nhận
  const [selectedIds, setSelectedIds] = useState([]);
  const [showMailModal, setShowMailModal] = useState(false);

  // load dữ liệu
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [courseData, studentsData] = await Promise.all([
          fetchCourseById(courseId),
          fetchStudents(courseId)
        ]);
        setCourse(courseData);
        setStudents(studentsData || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        setError('Không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  // filter + sort gộp 1 effect
  useEffect(() => {
    const lower = (searchTerm || '').toLowerCase();

    const filtered = !lower
      ? students
      : students.filter(s =>
          (s.name || '').toLowerCase().includes(lower) ||
          (s.email || '').toLowerCase().includes(lower)
        );

    const sorted = [...filtered].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') comp = (a.name || '').localeCompare(b.name || '');
      else if (sortBy === 'progress') comp = (a.progress || 0) - (b.progress || 0);
      else if (sortBy === 'enrolledDate') comp = new Date(a.enrolledDate) - new Date(b.enrolledDate);
      else if (sortBy === 'lastActive') comp = new Date(a.lastActive) - new Date(b.lastActive);
      return sortOrder === 'asc' ? comp : -comp;
    });

    setViewStudents(sorted);
  }, [students, searchTerm, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportExcel = () => {
    const exportData = viewStudents.map(s => ({
      Name: s.name,
      Email: s.email,
      EnrolledDate: s.enrolledDate ? new Date(s.enrolledDate).toLocaleDateString() : '',
      Progress: `${s.progress ?? 0}%`,
      LastActive: s.lastActive ? new Date(s.lastActive).toLocaleDateString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `students_${courseId}.xlsx`);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === viewStudents.length && viewStudents.length > 0) setSelectedIds([]);
    else setSelectedIds(viewStudents.map(s => s.id));
  };

  const selectedEmails = useMemo(() => {
    if (selectedIds.length > 0) {
      return viewStudents.filter(s => selectedIds.includes(s.id)).map(s => s.email);
    }
    return viewStudents.map(s => s.email);
  }, [selectedIds, viewStudents]);

  if (loading)
    return <div className="flex justify-center items-center h-64 text-primary-500">Đang tải dữ liệu...</div>;

  if (error)
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;

  if (!course)
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">Không tìm thấy khóa học</h2>
        <Link to="/courses" className="btn btn-primary mt-4">Quay lại danh sách</Link>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4">
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Quay lại khóa học
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-gray-600">{viewStudents.length} học viên</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="btn btn-outline flex items-center">
            <FiDownload className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowMailModal(true)}
            className="btn btn-outline flex items-center"
            title={selectedIds.length ? `Gửi mail cho ${selectedIds.length} người` : 'Gửi mail cho tất cả (đang lọc)'}
          >
            <FiMail className="mr-2" />
            Gửi mail
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          className="form-input pl-10 w-full"
          placeholder="Tìm học viên theo tên hoặc email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        {viewStudents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Không có học viên phù hợp.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={viewStudents.length > 0 && selectedIds.length === viewStudents.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => toggleSort('name')}>
                  Học viên {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => toggleSort('enrolledDate')}>
                  Ngày tham gia {sortBy === 'enrolledDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => toggleSort('progress')}>
                  Tiến độ {sortBy === 'progress' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => toggleSort('lastActive')}>
                  Hoạt động {sortBy === 'lastActive' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viewStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelect(student.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                        {(student.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <FiCalendar className="inline-block mr-1 text-gray-400" />
                    {student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700">{student.progress ?? 0}%</span>
                    <div className="w-full bg-gray-200 h-2 rounded mt-1">
                      <div
                        className={`h-2 rounded ${
                          Number(student.progress ?? 0) >= 70 ? 'bg-green-500'
                            : Number(student.progress ?? 0) >= 30 ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Number(student.progress ?? 0)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <FiClock className="inline-block mr-1 text-gray-400" />
                    {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary-600 hover:text-primary-800 mr-3" title="Xem chi tiết">
                      <FiExternalLink />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      title="Gửi mail cho người này"
                      onClick={() => { setSelectedIds([student.id]); setShowMailModal(true); }}
                    >
                      <FiMail />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal gửi email */}
      {showMailModal && (
        <AdminSendHtmlMailModal
          open={showMailModal}
          onClose={() => setShowMailModal(false)}
          defaultEmails={selectedEmails}
        />
      )}
    </div>
  );
}
