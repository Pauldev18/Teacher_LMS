import React, { useState } from 'react';
import { ThumbsUp, CornerDownRight, Trash2, Edit2 } from 'lucide-react';

const CommentItem = ({
  comment,
  currentUser,
  onSubmitReply,
  onSubmitEdit,
  onDelete,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isMine = currentUser?.id === comment.userId;
  const isInstructor = comment.roles === 'INSTRUCTOR';

  const formatDate = dateString =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const handleReplySubmit = async (e) => {
    await onSubmitReply(e, comment.id, replyText);
    setIsReplying(false);
    setReplyText('');
  };

  const handleEditSubmit = async (e) => {
    await onSubmitEdit(e, comment.id, editText);
    setIsEditing(false);
  };

  return (
    <div
      className={`p-4 rounded-lg mb-4 transition-all ${
        isInstructor ? 'bg-yellow-50' : 'bg-white'
      } ${isMine ? 'bg-blue-50' : ''}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={`font-medium ${isMine ? 'text-blue-600' : 'text-gray-900'}`}>
            {comment.userName}{isMine && ' (Bạn)'}
          </span>
          {isInstructor && (
            <span className="text-xs font-semibold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded-full">
              Giảng viên
            </span>
          )}
          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
        </div>
        <button className="flex items-center text-gray-500 hover:text-blue-600">
          <ThumbsUp className="w-4 h-4 mr-1" />
          <span className="text-sm">{comment.likes || 0}</span>
        </button>
      </div>

      {/* Nội dung / Sửa */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mt-2">
          <textarea
            className="w-full rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            rows="2"
            value={editText}
            onChange={e => setEditText(e.target.value)}
          />
          <div className="flex justify-end mt-2 gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 text-sm"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 text-sm"
            >
              Lưu
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 text-gray-700">{comment.content}</p>
      )}

      {/* Action buttons */}
      <div className="mt-2 flex justify-end space-x-2">
        {isMine ? (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-sm text-gray-500 hover:text-yellow-600"
            >
              <Edit2 className="w-4 h-4 mr-1" />Edit
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center text-sm text-gray-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />Delete
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsReplying(prev => !prev)}
            className="flex items-center text-sm text-gray-500 hover:text-blue-600"
          >
            <CornerDownRight className="w-4 h-4 mr-1" />Reply
          </button>
        )}
      </div>

      {/* Reply form */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-2 ml-4">
          <textarea
            className="w-full rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="Nhập câu trả lời..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
          />
          <div className="flex justify-end mt-2 gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
            >
              Gửi
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-6 mt-4 space-y-4">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onSubmitReply={onSubmitReply}
              onSubmitEdit={onSubmitEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
