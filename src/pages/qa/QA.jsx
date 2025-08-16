import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import CommentSection from './CommentSection';
import { fetchContentList } from '../../services/Lecture';

const QA = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [contentList, setContentList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy commentId từ hash: #comment-<id>
  const highlightCommentId = useMemo(() => {
    const h = location.hash?.startsWith('#') ? location.hash.slice(1) : (location.hash || '');
    if (!h.startsWith('comment-')) return null;
    const id = h.substring('comment-'.length);
    return id || null;
  }, [location.hash]);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const data = await fetchContentList(courseId);
      setContentList(data);
      setLoading(false);

      // Ưu tiên chọn theo ?lecture=...
      const lectureId = searchParams.get('lecture');
      const matched = lectureId ? data.find(x => x.id === lectureId) : null;
      if (matched) {
        setSelectedItem(matched);
      } else if (data.length > 0) {
        // Chọn mặc định item đầu tiên và đồng bộ URL (giữ hash nếu có)
        setSelectedItem(data[0]);
        const hash = location.hash || '';
        navigate({ search: `?lecture=${data[0].id}`, hash }, { replace: true });
      }
    };
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Nếu URL đổi ?lecture=... khi đang ở trang -> đồng bộ selectedItem
  useEffect(() => {
    if (!contentList?.length) return;
    const lectureId = searchParams.get('lecture');
    const matched = lectureId ? contentList.find(x => x.id === lectureId) : null;
    if (matched && matched.id !== selectedItem?.id) {
      setSelectedItem(matched);
    }
  }, [searchParams, contentList, selectedItem]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const hash = location.hash || '';
    navigate({ search: `?lecture=${item.id}`, hash }, { replace: false });
  };

  return (
    <div className="max-w-[1440px] mx-auto mt-6 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Nội dung khóa học & Q&A</h1>

      <div className="flex gap-6 items-start">
        {/* Cột trái: Danh sách bài học */}
        <div className="w-1/4 bg-white rounded-lg shadow p-4 sticky top-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Nội dung khóa học</h2>
          {loading ? (
            <p className="text-gray-500">Đang tải...</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {contentList.map(item => (
                <li
                  key={item.id}
                  className={`py-3 px-2 hover:bg-blue-50 cursor-pointer rounded ${
                    selectedItem?.id === item.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleSelectItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-gray-500" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 mt-1">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cột phải: Q&A */}
        <div className="w-3/4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Questions & Answers</h2>
          </div>

          <div className="bg-white rounded-lg shadow p-4 max-h-[75vh] overflow-y-auto">
            {selectedItem ? (
              selectedItem.type === 'lecture' ? (
                <CommentSection
                  lectureId={selectedItem.id}
                  highlightCommentId={highlightCommentId}
                />
              ) : (
                <div className="text-center text-gray-600 py-12">
                  Phần quiz không có bình luận. Chọn bài giảng để xem Q&A.
                </div>
              )
            ) : (
              <div className="text-center text-gray-500 py-12">
                Vui lòng chọn một nội dung để xem bình luận.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QA;
