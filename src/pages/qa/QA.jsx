import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import CommentSection from './CommentSection';
import { fetchContentList } from '../../services/Lecture';

const QA = () => {
  const { courseId } = useParams();
  const [contentList, setContentList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const data = await fetchContentList(courseId);
      setContentList(data);
      setLoading(false);
    };
    loadContent();
  }, [courseId]);

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
                  onClick={() => setSelectedItem(item)}
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
                <CommentSection lectureId={selectedItem.id} />
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
