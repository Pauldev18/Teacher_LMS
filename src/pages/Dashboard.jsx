// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlusCircle, FiUsers, FiMessageSquare, FiBook, FiClock } from 'react-icons/fi';

import { fetchCoursesyInstructor } from '../services/courseService';
import CourseCard from '../components/courses/CourseCard';
import { fetchInstructorStats } from '../services/instructorService';
import { getMyNotifications, markRead } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 5;

function toRelativeTime(iso) {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return d.toLocaleString('vi-VN');
  } catch {
    return '';
  }
}

const isRead = (a) =>
  Boolean(a?.read ?? a?.isRead ?? a?.is_read ?? a?._raw?.read ?? a?._raw?.isRead ?? false);

const sortPageItems = (items) =>
  [...items].sort((a, b) => {
    const ar = isRead(a), br = isRead(b);
    if (ar !== br) return ar ? 1 : -1;
    const at = a.createdAt, bt = b.createdAt;
    const aTime = at ? new Date(at).getTime() : 0;
    const bTime = bt ? new Date(bt).getTime() : 0;
    return bTime - aTime;
  });

function mapNotificationToActivity(n) {
  return {
    id: `notif-${n.id}`,
    type: n.type || 'notification',
    description: n.title ? `${n.title}${n.body ? ' — ' + n.body : ''}` : (n.body || 'Thông báo'),
    time: toRelativeTime(n.createdAt),
    course: n.courseId ? `Khóa học #${String(n.courseId).slice(0, 6)}…` : undefined,
    courseId: n.courseId,
    link: n.link,
    createdAt: n.createdAt,
    _raw: n,
  };
}

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalMessages: 0,
    totalRevenue: 0,
  });

  const [pageIdx, setPageIdx] = useState(0);
  const [pageItems, setPageItems] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);

  const navigate = useNavigate();
  const { currentUserLMS } = useAuth();
  const userId = currentUserLMS?.id; 

  const loadNotiPage = useCallback(async (p = 0) => {
    setLoadingPage(true);
    try {
      const res = await getMyNotifications(p, PAGE_SIZE);
      const content = Array.isArray(res?.content) ? res.content : [];
      const mapped = content.map(mapNotificationToActivity);
      setPageItems(sortPageItems(mapped));
      setTotalElements(Number(res?.totalElements ?? content.length));
      setTotalPages(Number(res?.totalPages ?? 1));
      setFirst(Boolean(res?.first ?? p === 0));
      setLast(Boolean(res?.last ?? true));
      setPageIdx(Number(res?.number ?? p));
    } catch (e) {
      console.error('Load notifications page failed', e);
    } finally {
      setLoadingPage(false);
    }
  }, []);

  // mở activity: mark read -> reload trang hiện tại
  const openActivity = useCallback(
    async (activity) => {
      const notifId = activity?._raw?.id ?? activity?.id?.toString().replace('notif-', '');
      const unread = !isRead(activity?._raw || {});
      if (notifId && unread) {
        try {
          await markRead(notifId);
          await loadNotiPage(pageIdx);
          window.dispatchEvent(new Event('app:reloadNotifications'));
        } catch (e) {
          console.error('markRead failed', e);
        }
      }

      if (activity.link) {
        if (activity.link.startsWith('http')) window.open(activity.link, '_blank');
        else navigate(activity.link);
      } else if (activity.courseId) {
        navigate(`/courses/${activity.courseId}`);
      }
    },
    [navigate, pageIdx, loadNotiPage]
  );

  // load số liệu dashboard + trang noti đầu tiên
  useEffect(() => {
    const load = async () => {
      try {
        const [coursesData, statsData] = await Promise.all([
          fetchCoursesyInstructor(),
          fetchInstructorStats(),
        ]);
        setCourses((coursesData || []).slice(0, 3));
        setStats({
          totalStudents: statsData.totalStudents || 0,
          totalCourses: statsData.totalCourses || 0,
          totalMessages: statsData.totalMessages || 0,
          totalRevenue: statsData.totalRevenue || 0,
        });
        await loadNotiPage(0);
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadNotiPage]);

  // Lắng nghe sự kiện global từ Layout khi có noti mới
  useEffect(() => {
    const handler = async () => {
      if (pageIdx === 0) {
        await loadNotiPage(0);
      }
    };
    window.addEventListener('app:newNotification', handler);
    return () => window.removeEventListener('app:newNotification', handler);
  }, [pageIdx, loadNotiPage]);

  const start = useMemo(
    () => (totalElements === 0 ? 0 : pageIdx * PAGE_SIZE + 1),
    [pageIdx, totalElements]
  );
  const end = useMemo(
    () => (totalElements === 0 ? 0 : pageIdx * PAGE_SIZE + pageItems.length),
    [pageIdx, pageItems.length, totalElements]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Đang tải trang tổng quan...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Trang tổng quan</h1>
          <p className="mt-1 text-sm text-gray-500">Tổng quan về các hoạt động giảng dạy và khóa học của bạn</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/courses/new" className="btn btn-primary flex items-center">
            <FiPlusCircle className="mr-2" />
            Tạo khóa học
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="card flex items-center">
          <div className="bg-primary-100 p-3 rounded-full">
            <FiBook className="h-6 w-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng số khóa học</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalCourses}</p>
          </div>
        </div>

        <div className="card flex items-center">
          <div className="bg-secondary-100 p-3 rounded-full">
            <FiUsers className="h-6 w-6 text-secondary-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng số học viên</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
          </div>
        </div>

        <div className="card flex items-center">
          <div className="bg-green-100 p-3 rounded-full">
            <FiMessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tổng doanh thu</p>
            <p className="text-2xl font-semibold text-gray-900">
              {Number(stats.totalRevenue || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
            </p>
          </div>
        </div>
      </div>

      {/* Recent courses */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Các khóa học gần đây</h2>
      {courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-gray-500 mb-4">Bạn chưa tạo bất kỳ khóa học nào</p>
          <Link to="/courses/new" className="btn btn-primary inline-flex items-center">
            <FiPlusCircle className="mr-2" />
            Tạo khóa học đầu tiên của bạn
          </Link>
        </div>
      )}

      {/* Recent activity = Notifications (server-side paging) */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Hoạt động gần đây</h2>
      <div className="card">
        {pageItems.length > 0 ? (
          <>
            <ul className="divide-y divide-gray-200 list-none pl-0">
              {pageItems.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      {/* Title + badges */}
                      <p
                        className="text-sm font-medium cursor-pointer hover:text-primary-600 flex items-center flex-wrap gap-x-2 gap-y-1 text-gray-900"
                        onClick={() => openActivity(activity)}
                        title={activity.description}
                      >
                        <span className={`truncate ${isRead(activity._raw) ? 'text-gray-600' : ''}`}>
                          {activity.description}
                        </span>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            activity.type === 'MESSAGE'
                              ? 'bg-blue-100 text-blue-700'
                              : activity.type === 'COMMENT'
                              ? 'bg-amber-100 text-amber-700'
                              : activity.type === 'ENROLL'
                              ? 'bg-emerald-100 text-emerald-700'
                              : activity.type === 'REVIEW'
                              ? 'bg-fuchsia-100 text-fuchsia-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {activity.type || 'OTHER'}
                        </span>

                        {(typeof activity._raw?.read !== 'undefined' ||
                          typeof activity._raw?.isRead !== 'undefined') && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isRead(activity._raw) ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isRead(activity._raw) ? 'Đã đọc' : 'Chưa đọc'}
                          </span>
                        )}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>{activity.time}</span>
                        {activity.course && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{activity.course}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination dựa trên Page metadata từ server */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Hiển thị {start}–{end} / {totalElements}
              </div>
              <div className="inline-flex items-center gap-1">
                <button
                  className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                  onClick={() => loadNotiPage(pageIdx - 1)}
                  disabled={first || loadingPage}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1.5 rounded-md border text-sm ${
                      i === pageIdx ? 'bg-primary-600 text-white border-primary-600' : 'bg-white'
                    }`}
                    onClick={() => loadNotiPage(i)}
                    disabled={loadingPage}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
                  onClick={() => loadNotiPage(pageIdx + 1)}
                  disabled={last || loadingPage}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Không có hoạt động gần đây</p>
          </div>
        )}
      </div>
    </div>
  );
}
