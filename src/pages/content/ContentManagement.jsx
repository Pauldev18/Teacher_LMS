import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMove, 
  FiFolder, 
  FiFileText, 
  FiHelpCircle,
  FiArrowLeft,
  FiChevronRight,
  FiChevronDown,
  FiMoreVertical
} from 'react-icons/fi'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { deleteQuiz, fetchCourseById, fetchCourseContent } from '../../services/courseService'
import { CONTENT_TYPES } from '../../enum/enum'
import { deleteLecture, updateLectureSortOrders } from '../../services/lesssonService'
import { updateChapterSortOrders } from '../../services/chapterService'

const SortableItem = ({ id, children, className = '' }) => {
  const { attributes, setNodeRef, transform, transition, listeners } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <li ref={setNodeRef} style={style} className={className} {...attributes}>
      {children(listeners)}
    </li>
  )
}

const ContentManagement = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [content, setContent] = useState([])
  const [expandedItems, setExpandedItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openHeaderDropdown, setOpenHeaderDropdown] = useState(null)
  const [openChapterDropdown, setOpenChapterDropdown] = useState({})
  const [openItemMenu, setOpenItemMenu] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const loadCourseData = async () => {
      try {
        setLoading(true)
        const [courseData, contentData] = await Promise.all([
          fetchCourseById(courseId),
          fetchCourseContent(courseId)
        ])
        setCourse(courseData)
        setContent(contentData)
        console.log('Course content:', contentData)
        
        const expanded = {}
        contentData.forEach(item => {
          if (item.type === CONTENT_TYPES.CHAPTER) {
            expanded[item.id] = true
          }
        })
        setExpandedItems(expanded)
      } catch (error) {
        console.error('Error loading course content:', error)
      setError('Failed to load course. Please try again. ' + (error.message || ''));

      } finally {
        setLoading(false)
      }
    }
  useEffect(() => {
    loadCourseData()
  }, [courseId])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setOpenHeaderDropdown(null)
        setOpenChapterDropdown({})
        setOpenItemMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditClick = (item, e) => {
    e.stopPropagation()
    if (item.type === CONTENT_TYPES.QUIZ) {
      navigate(`/courses/${courseId}/quiz/${item.id}/edit`)
    } else {
      navigate(`/courses/${courseId}/content/${item.id}`)
    }
  }
  
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }
  
  const getContentIcon = (type) => {
    switch (type) {
      case CONTENT_TYPES.CHAPTER:
        return <FiFolder className="h-5 w-5" />
      case CONTENT_TYPES.LESSON:
        return <FiFileText className="h-5 w-5" />
      case CONTENT_TYPES.QUIZ:
        return <FiHelpCircle className="h-5 w-5" />
      default:
        return <FiFileText className="h-5 w-5" />
    }
  }
  
  const getContentTypeColor = (type) => {
    switch (type) {
      case CONTENT_TYPES.CHAPTER:
        return 'text-primary-600'
      case CONTENT_TYPES.LESSON:
        return 'text-gray-600'
      case CONTENT_TYPES.QUIZ:
        return 'text-accent-600'
      default:
        return 'text-gray-600'
    }
  }

 const handleDragEnd = (event) => {
  const { active, over } = event
  if (!active || !over) return

  console.log('📦 handleDragEnd:', {
    draggedId: active.id,
    droppedOnId: over.id
  })

  if (active.id !== over.id) {
    setContent((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      console.log(`👉 Di chuyển item từ vị trí ${oldIndex} sang vị trí ${newIndex}`)
      const result = arrayMove(items, oldIndex, newIndex)

      // Cập nhật lại sortOrder mới cho từng item
      const chaptersWithNewOrder = result.map((item, idx) => ({
        ...item,
        sortOrder: idx 
      }));

      // Gọi API update sortOrder
      updateChapterSortOrders(chaptersWithNewOrder);

      console.log('➡️ Mảng sau khi move:', chaptersWithNewOrder)
      return chaptersWithNewOrder
    })
  }
}

function findItemById(id) {
  for (const chapter of content) {
    if (chapter.children) {
      const found = chapter.children.find(item => item.id === id);
      if (found) return found;
    }
  }
  return null;
}


const handleChapterContentDragEnd = (chapterId, event) => {
const { active, over } = event;
  if (!active || !over) return;
  // Không cho đổi chỗ nếu over là quiz
  const overItem = findItemById(over.id); // Viết hàm tìm trong data tree
  if (overItem && overItem.type === "quiz") {
    return; 
  }

  setContent(prevContent => {
    const updatedContent = [...prevContent];
    const chapter = updatedContent.find(item => item.id === chapterId);
    if (!chapter || !chapter.children) return prevContent;

    const children = [...chapter.children];
    const oldIndex = children.findIndex(item => item.id === active.id);
    const newIndex = children.findIndex(item => item.id === over.id);

    // Thay đổi UI local trước
    chapter.children = arrayMove(children, oldIndex, newIndex);

    
    // Gửi update API sau khi setContent chạy xong
    setTimeout(() => {
      updateLectureSortOrders(
        chapter.children.map((child, idx) => ({
          id: child.id,
          sortOrder: idx // hoặc idx+1 tuỳ logic backend
        }))
      );
    }, 0);

    return updatedContent;
  });
};


  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading course content...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Course not found</h2>
        <p className="mt-2 text-gray-500">The course you're looking for doesn't exist or has been removed.</p>
        <Link to="/courses" className="btn btn-primary mt-4">
          Back to Courses
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back to Course
      </button>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-1">{course.title}</h1>
          <p className="text-gray-600">Organize your course content and structure</p>
        </div>
        
      <div className="mt-4 md:mt-0">
  <Link
    to={`/courses/${courseId}/content/new?type=chapter`}
    className="btn btn-primary flex items-center"
  >
    <FiPlus className="mr-2" />
    Add Chapter
  </Link>
</div>
      </div>
      
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {content.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiFolder className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-500 mb-6">Start building your course by adding chapters and lessons</p>
            <div className="flex justify-center space-x-3">
              <Link
                to={`/courses/${courseId}/content/new?type=chapter`}
                className="btn btn-primary"
              >
                Add First Chapter
              </Link>
            </div>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={content.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-gray-200">
                {content.map((chapter) => (
                  <SortableItem key={chapter.id} id={chapter.id} className="relative">
                    {(dragListeners) => (
                      <>
                        <div
                          className={`flex items-center px-4 py-4 cursor-pointer hover:bg-gray-50 ${expandedItems[chapter.id] ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleExpand(chapter.id)}
                        >
                          <button 
                            className="mr-2 text-gray-400 hover:text-gray-500 cursor-grab"
                            onClick={(e) => e.stopPropagation()}
                            {...dragListeners}
                          >
                            <FiMove className="h-5 w-5" />
                          </button>
                          <div className={`mr-2 ${getContentTypeColor(chapter.type)}`}>
                            {getContentIcon(chapter.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {chapter.title}
                              </span>
                              <span className="ml-2 flex-shrink-0">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {chapter.children ? chapter.children.length : 0} items
                                </span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{chapter.description}</p>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex items-center">
                            <button
                              className="text-gray-400 hover:text-gray-500 p-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Edit chapter clicked', chapter.id)
                                navigate(`/courses/${courseId}/content/${chapter.id}?type=chapter`)
                              }}
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button
                              className="ml-2 text-gray-400 hover:text-red-500 p-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Delete chapter clicked', chapter.id)
                              }}
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                            <button
                              className="ml-2 text-gray-400 hover:text-gray-500 p-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(chapter.id)
                              }}
                            >
                              {expandedItems[chapter.id] ? (
                                <FiChevronDown className="h-5 w-5" />
                              ) : (
                                <FiChevronRight className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {expandedItems[chapter.id] && chapter.children && (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleChapterContentDragEnd(chapter.id, event)}
                          >
                            <SortableContext
                              items={chapter.children.map(item => item.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <ul className="border-t border-gray-100 bg-gray-50 pl-10">
                                {chapter.children.map((item) => (
                                  <SortableItem key={item.id} id={item.id}  disabled={item.type === "quiz"}>
                                    {(dragListeners) => (
                                      <div className="flex items-center px-4 py-3 hover:bg-gray-100">
                                       {item.type !== "quiz" && (
                                            <button 
                                              className="mr-2 text-gray-400 hover:text-gray-500 cursor-grab"
                                              onClick={(e) => e.stopPropagation()}
                                              {...dragListeners}
                                            >
                                              <FiMove className="h-4 w-4" />
                                            </button>
                                          )}

                                        <div className={`mr-2 ${getContentTypeColor(item.type)}`}>
                                          {getContentIcon(item.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center">
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                              {item.title}
                                            </span>
                                            {item.duration && (
                                              <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
                                                {item.duration}
                                              </span>
                                            )}
                                          </div>
                                          {item.description && (
                                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                          )}
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                          <div className="dropdown relative">
                                            <button 
                                              className="text-gray-400 hover:text-gray-500 p-1"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setOpenItemMenu(openItemMenu === item.id ? null : item.id)
                                              }}
                                            >
                                              <FiMoreVertical className="h-5 w-5" />
                                            </button>
                                            {openItemMenu === item.id && (
                                              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white shadow-lg rounded-md py-1 z-10">
                                                <button
                                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                  onClick={(e) => handleEditClick(item, e)}
                                                >
                                                  <FiEdit2 className="mr-2 text-gray-500" />
                                                  Edit
                                                </button>
                                               <button
                                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                    onClick={async (e) => {
                                                      e.stopPropagation();
                                                      console.log('Delete item clicked', item.id, item.type);
                                                     try {
                                                        if (item.type === "lesson") {
                                                          await deleteLecture(item.id);
                                                        } else if (item.type === "quiz") {
                                                          await deleteQuiz(item.id);
                                                        }
                                                        await loadCourseData(); // reload lại dữ liệu sau khi xoá
                                                      } catch (err) {
                                                        console.error("Xoá thất bại:", err);
                                                      }

                                                    }}
                                                  >
                                                    <FiTrash2 className="mr-2 text-red-500" />
                                                    Delete
                                                  </button>

                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </SortableItem>
                                ))}
                              </ul>
                            </SortableContext>
                          </DndContext>
                        )}
                        
                        {expandedItems[chapter.id] && (
                          <div className="px-4 py-2">
                            <div className="dropdown relative">
                              <button 
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                                onClick={(e) => {
                                  console.log('Add to this chapter clicked' + chapter.id)
                                  e.stopPropagation()
                                  setOpenChapterDropdown(prev => ({
                                    ...prev,
                                    [chapter.id]: !prev[chapter.id]
                                  }))
                                }}
                              >
                                <FiPlus className="mr-1" />
                                Add to this chapter
                              </button>
                              {openChapterDropdown[chapter.id] && (
                               <div className="absolute left-0 bottom-full mb-2 w-48 bg-white shadow-lg rounded-md py-1 z-10">
                                  <Link
                                    to={`/courses/${courseId}/content/new?type=lesson&chapterId=${chapter.id}`}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiFileText className="mr-2 text-gray-500" />
                                    New Lesson
                                  </Link>
                                  <Link
                                    to={`/courses/${courseId}/quiz/new?chapterId=${chapter.id}`}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FiHelpCircle className="mr-2 text-accent-500" />
                                    New Quiz
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableItem>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
      
      {content.length > 0 && (
        <div className="mt-6 p-4 bg-primary-50 border border-primary-100 rounded-lg">
          <h3 className="text-primary-800 font-medium mb-2">Mẹo sắp xếp nội dung hiệu quả</h3>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>• Kéo thả các mục để thay đổi thứ tự nội dung</li>
            <li>• Nhóm các bài học liên quan thành chương</li>
            <li>• Thêm bài kiểm tra ở cuối chương để củng cố kiến thức</li>
            <li>• Đặt tiêu đề bài học rõ ràng, dễ hiểu</li>
          </ul>
        </div>
      
      )}
    </div>
  )
}

export default ContentManagement