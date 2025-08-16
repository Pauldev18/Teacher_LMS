import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, getUnreadCount, markRead, markAllRead } from '../../services/notificationService';
import { toast } from 'react-toastify';

function typeBadge(nType) {
  const t = String(nType || '').toUpperCase();
  // Map type -> màu + text
  const map = {
    MESSAGE: { text: 'Tin nhắn', cls: 'bg-blue-100 text-blue-700' },
    COMMENT: { text: 'Bình luận', cls: 'bg-amber-100 text-amber-700' },
    REVIEW:  { text: 'Đánh giá',  cls: 'bg-fuchsia-100 text-fuchsia-700' },
    ENROLL:  { text: 'Ghi danh',  cls: 'bg-emerald-100 text-emerald-700' },
    LECTURE_COMMENT: { text: 'Bình luận', cls: 'bg-amber-100 text-amber-700' },
    LECTURE_COMMENT_REPLY: { text: 'Phản hồi', cls: 'bg-purple-100 text-purple-700' },
    CHAT_MESSAGE: { text: 'Tin nhắn', cls: 'bg-blue-100 text-blue-700' },
  };
  return map[t] || { text: t || 'Khác', cls: 'bg-gray-100 text-gray-700' };
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]); // danh sách chưa đọc (tối đa 10)
  const ref = useRef(null);
  const navigate = useNavigate();

  // Load số chưa đọc + 10 bản ghi gần nhất (lọc chưa đọc phía client)
  const load = useCallback(async () => {
    try {
      const [cnt, page] = await Promise.all([
        getUnreadCount(),
        getMyNotifications(0, 10),
      ]);
      setUnread(Number(cnt) || 0);
      const content = Array.isArray(page?.content) ? page.content : [];
      const unreadOnly = content.filter(n => (n.read ?? n.isRead ?? n.is_read) === false);
      setItems(unreadOnly);
    } catch (e) {
      console.error('load notifications failed', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const onDoc = (e) => {
      if (open && ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const badgeText = useMemo(() => unread > 99 ? '99+' : String(unread || 0), [unread]);

  // Click 1 item: mark read + navigate
  const handleClickItem = async (n) => {
    try {
      await markRead(n.id);
      // Giảm số chưa đọc + loại khỏi list dropdown
      setUnread(prev => Math.max(0, prev - 1));
      setItems(prev => prev.filter(x => x.id !== n.id));
      setOpen(false);

      const link = n.link || '';
      if (link) {
        if (link.startsWith('http')) window.open(link, '_blank');
        else navigate(link);
      } else {
        toast.info(n.title || 'Thông báo');
      }
    } catch (e) {
      console.error('markRead failed', e);
      toast.error('Không đánh dấu đã đọc được');
    }
  };

  const handleMarkAll = async () => {
    try {
      const updated = await markAllRead();
      setUnread(0);
      setItems([]);
      toast.success(`Đã đánh dấu ${updated} thông báo là đã đọc`);
    } catch (e) {
      console.error('markAllRead failed', e);
      toast.error('Không đánh dấu tất cả được');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={() => setOpen(v => !v)}
        title="Thông báo"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center">
            {badgeText}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[70vh] overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">Thông báo</div>
            <button
              onClick={handleMarkAll}
              className="text-sm text-primary-600 hover:underline disabled:text-gray-400"
              disabled={unread === 0}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Không có thông báo chưa đọc</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((n) => {
                const { text, cls } = typeBadge(n.type);
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClickItem(n)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-2">
                        <span className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                          {text}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</div>
                          {n.body && (
                            <div className="text-sm text-gray-600 line-clamp-2">{n.body}</div>
                          )}
                          <div className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
