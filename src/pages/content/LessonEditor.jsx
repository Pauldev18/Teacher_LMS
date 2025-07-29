import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FiSave, FiArrowLeft, FiExternalLink } from 'react-icons/fi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { CONTENT_TYPES } from '../../data/mockData'
import { fetchCourseById, createCourseContent, updateCourseContent, fetchCourseContentById } from '../../services/courseService'
import { fetchChapterById, updateChapter } from '../../services/chapterService'

const LessonEditor = () => {
  const { courseId, contentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
   const [videoFile, setVideoFile] = useState(null);

  // Get content type from URL query param (chapter or lesson)
  const contentType = queryParams.get('type') || CONTENT_TYPES.LESSON
  const chapterId = queryParams.get('chapterId')
  
  
  const isNewContent = contentId === 'new'
  const isChapter = contentType === CONTENT_TYPES.CHAPTER


  const [course, setCourse] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  const { 
    register, 
    handleSubmit, 
       setValue,
    formState: { errors } 
  } = useForm()
  
  // Fetch course data
  useEffect(() => {
    const loadData = async () => {
      try {
        const courseData = await fetchCourseById(courseId)
        setCourse(courseData)
        console.log(isChapter ? 'Chapter' : 'Lesson')
        if (!isNewContent) {
        if (isChapter) {
          // → call your chapter endpoint
          const chapterData = await fetchChapterById(contentId);
          setContent(chapterData);
          setValue('title', chapterData.title);
          setValue('description', chapterData.description || '');
          setValue('hasQuiz', chapterData.hasQuiz || false);
        } else {
          
          const lessonData = await fetchCourseContentById(contentId);
          setContent(lessonData);
          setValue('title', lessonData.title);
          setValue('description', lessonData.description || '');
          setValue('duration', lessonData.duration || '');
          setValue('hasDemo', lessonData.isDemo || false);
        }
      }
    
        
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [courseId, contentId, isNewContent])
  
  // Theo dõi videoFile để tính duration
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoFile(file);

    // Tạo blob URL và element video ẩn để đọc metadata
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const seconds = video.duration;
      // Chuyển sang định dạng "m phút s giây" hoặc "15 mins"
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const formatted = secs === 0 
        ? `${mins} mins` 
        : `${mins}m ${secs}s`;

      // Gán vào field 'duration' của form
      setValue('duration', formatted, { shouldValidate: true });
    };
  };
  const onSubmit = async (data) => {
    try {
      setSaving(true)
      setError(null)
      
      const contentData = {
        ...data,
        type: contentType,
        videoFile : videoFile, 
        courseId: courseId,
        isChapter: isChapter,
        contentId: contentId, 
        // If it's a lesson and has a chapter, set the chapterId
        ...(contentType === CONTENT_TYPES.LESSON && chapterId && { chapterId }),
      }
      
      if (isNewContent) {
        console.log('Creating new content:', contentData)
        await createCourseContent(courseId, contentData)
      } else {
        if(isChapter) {
          console.log('Updating chapter:', contentData)
          await updateChapter(contentData)
        }
        else {
          console.log('Updating lesson:', contentData)
          await updateCourseContent(courseId, contentId, contentData)
        }
      }
      
      setSaveSuccess(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/courses/${courseId}/content`)
      }, 1500)
      
    } catch (error) {
      console.error('Error saving content:', error)
      setError('Failed to save content. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(`/courses/${courseId}/content`)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back to Content
      </button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {isNewContent ? `Add New ${isChapter ? 'Chapter' : 'Lesson'}` : 'Edit Content'}
        </h1>
        <p className="text-gray-600">
          {isChapter 
            ? 'Create a chapter to organize related lessons' 
            : 'Create engaging content for your students'}
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {saveSuccess && (
        <div className="mb-6 p-4 border-l-4 border-green-500 bg-green-50">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                {isNewContent ? 'Content created successfully!' : 'Content updated successfully!'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-card rounded-lg p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="form-label">
              {isChapter ? 'Chapter Title' : 'Lesson Title'} <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder={isChapter ? 'e.g., Getting Started with HTML' : 'e.g., HTML Document Structure'}
              {...register('title', { 
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
                maxLength: { value: 100, message: 'Title must not exceed 100 characters' }
              })}
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              rows="2"
              className="form-input"
              placeholder="Brief description of this content..."
              {...register('description')}
            ></textarea>
          </div>
          
         {!isChapter && (
        <>
          {/* Chọn video */}
          <div>
            <label htmlFor="video" className="form-label">
              Chọn Video <span className="text-red-500">*</span>
            </label>
            <input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="block w-full text-sm text-gray-700"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-gray-600">
                Đã chọn: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Duration tự tính */}
          <div>
            <label htmlFor="duration" className="form-label">
              Estimated Duration
            </label>
            <input
              id="duration"
              type="text"
              className="form-input"
              placeholder="e.g., 15 mins"
              {...register('duration', { 
                required: 'Duration is required', 
                minLength: { value: 1, message: 'Duration không được để trống' }
              })}
              readOnly
            />
            {errors.duration && (
              <p className="form-error mt-1">{errors.duration.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Tự động tính từ file video đã chọn
            </p>
          </div>
        </>
      )}
          
          {/* hasQuiz */}
          {isChapter && (
            <div>
              <label htmlFor="hasQuiz" className="form-label">Có bài quiz?</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasQuiz"
                  {...register('hasQuiz')}
                  className="form-checkbox"
                />
                <label htmlFor="hasQuiz" className="text-sm">Chapter này có quiz</label>
              </div>
            </div>
          )}

           {!isChapter && (
            <div>
              <label htmlFor="hasDemo" className="form-label">Có cho xem priview?</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasDemo"
                  {...register('hasDemo')}
                  className="form-checkbox"
                />
                <label htmlFor="hasDemo" className="text-sm">Public video?</label>
              </div>
            </div>
          )}
          {/* Preview link - for lessons */}
          {!isChapter && !isNewContent && (
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn btn-outline flex items-center"
              >
                <FiExternalLink className="mr-2" />
                Preview Lesson
              </button>
              <p className="text-xs text-gray-500 mt-1">
                See how this lesson will appear to students
              </p>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 border-t pt-6 mt-6">
          <button
            type="button"
            onClick={() => navigate(`/courses/${courseId}/content`)}
            className="btn btn-outline"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={saving}
          >
            <FiSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LessonEditor