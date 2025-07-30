import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createLectureComment, fetchCommentsTree } from '../../services/LectureComment';
import CommentItem from './CommentItem';
import { v4 as uuidv4 } from 'uuid';
import { deleteLectureComment, updateLectureComment } from '../../services/Lecture';

const CommentSection = ({ lectureId }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const { currentUserLMS } = useAuth();

  useEffect(() => {
    fetchCommentsTree(lectureId)
      .then(tree => setComments(tree))
      .catch(err => console.error('Lỗi khi lấy bình luận:', err));
  }, [lectureId]);


  const updateCommentById = (list, idToUpdate, newText) => {
  return list.map(comment => {
    if (comment.id === idToUpdate) {
      return { ...comment, content: newText };
    }

    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentById(comment.replies, idToUpdate, newText),
      };
    }

    return comment;
  });
};

 const handleEdit = async (e, id, newText) => {
  e.preventDefault();
  try {
    await updateLectureComment(id, newText);
    setComments(prev => updateCommentById(prev, id, newText));
  } catch (error) {
    console.error('❌ Lỗi khi sửa bình luận:', error);
  }
};


const removeCommentById = (list, idToDelete) => {
  return list
    .map(comment => {
      if (comment.id === idToDelete) {
        return null; // xoá comment này
      }

      // Nếu có replies → xử lý tiếp
      const updatedReplies = comment.replies
        ? removeCommentById(comment.replies, idToDelete)
        : [];

      return { ...comment, replies: updatedReplies };
    })
    .filter(Boolean); // loại bỏ phần null
};


const handleDelete = async id => {
  if (!window.confirm('Bạn có chắc muốn xoá bình luận này không?')) return;

  try {
    await deleteLectureComment(id);
    setComments(prev => removeCommentById(prev, id));
  } catch (error) {
    console.error('❌ Lỗi khi xoá bình luận:', error);
  }
};


  const handleSubmit = async e => {
    e.preventDefault();
    if (!currentUserLMS || !commentText.trim()) return;

    const payload = {
      id: uuidv4(),
      lectureId,
      userId: currentUserLMS.id,
      content: commentText,
    };

    try {
      const newComment = await createLectureComment(payload);
      setComments(prev => [
        ...prev,
        { ...newComment, userName: currentUserLMS.name, replies: [] },
      ]);
      setCommentText('');
    } catch {
      alert('Không thể gửi bình luận. Vui lòng thử lại.');
    }
  };
const addReplyToCommentTree = (list, parentId, reply) => {
  return list.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), reply],
      };
    }

    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToCommentTree(comment.replies, parentId, reply),
      };
    }

    return comment;
  });
};

 const handleReply = async (e, parentId, text) => {
  e.preventDefault();

  const commentPayload = {
    id: uuidv4(),
    lectureId,
    userId: currentUserLMS.id,
    parentId: parentId,
    content: text
  };

  try {
    const newReply = await createLectureComment(commentPayload);
    const replyObj = { ...newReply, userName: currentUserLMS.name, replies: [] };

    setComments(prev => addReplyToCommentTree(prev, parentId, replyObj));
  } catch (error) {
    console.error('❌ Lỗi khi gửi reply:', error);
  }
};


  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Questions & Answers</h2>

      {currentUserLMS ? (
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-3 border rounded-md focus:ring-blue-500"
            rows="3"
            placeholder="Ask a question or share your thoughts..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
              Submit
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Bạn cần đăng nhập để bình luận.</p>
          <a href="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </a>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {!comments.length && (
          <p className="text-gray-500 text-center py-4">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </p>
        )}

        {comments.map(comment => (
         <CommentItem
          key={comment.id}
          comment={comment}
          currentUserLMS={currentUserLMS}
          onSubmitReply={handleReply}
          onSubmitEdit={handleEdit}     
          onDelete={handleDelete}      
        />

        ))}
      </div>
    </div>
  );
};

export default CommentSection;
