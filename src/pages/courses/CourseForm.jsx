import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { FiSave, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { createCourse, fetchCourseById, updateCourse } from '../../services/courseService'
import { fetchCategories } from '../../services/categoryService'
import { fetchLevels } from '../../services/levelService'
import { toast } from 'react-toastify'

const CourseForm = () => {
  const { courseId } = useParams()
  const isEditMode = !!courseId
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [categories, setCategories] = useState([])
  const [levels, setLevels] = useState([])

  // File và preview cho thumbnail
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    control,
    formState: { errors } 
  } = useForm()

  // Lấy danh mục & level
  useEffect(() => {
    const fetchData = async () => {
      setCategories(await fetchCategories())
      setLevels(await fetchLevels())
    }
    fetchData()
  }, [])

  // Load course khi edit, chỉ khi đã có category & level
  useEffect(() => {
    if (isEditMode && categories.length > 0 && levels.length > 0) {
      const loadCourse = async () => {
        try {
          setLoading(true)
          const courseData = await fetchCourseById(courseId)
          reset({
            ...courseData,
            category: courseData.categoryId?.toString() || '',
            level: courseData.levelId?.toString() || '',
            price: courseData.price || '',
            discountPrice: courseData.discountPrice || '',
            language: courseData.language || '',
            duration: courseData.duration || ''
          })
          setDescription(courseData.description || '')
          setRequirements(courseData.requirements || '')
          setThumbnailPreview(courseData.thumbnail || '')
          setThumbnailFile(null)
        } catch (error) {
          setErrorMessage('Failed to load course data. Please try again. (Lỗi: ' + error.message + ')')
        } finally {
          setLoading(false)
        }
      }
      loadCourse()
    }
  }, [isEditMode, courseId, categories, levels, reset])

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  // Submit
  const onSubmit = async (data) => {
    try {
      setSaving(true)
      setErrorMessage('')
      // Gom dữ liệu gửi lên
      const courseData = {
        ...data,
        description,
        requirements
      }

      let result
      if (isEditMode) {
        result = await updateCourse(courseId, courseData, thumbnailFile)
        setSuccessMessage('Course updated successfully!')
        toast.success('Cập nhật khóa học thành công!')
      } else {
        result = await createCourse(courseData, thumbnailFile)
        setSuccessMessage('Course created successfully!')
        toast.success('Tạo khóa học thành công!')
      }
        navigate(`/courses/${result.id}`)
    } catch (error) {
      setErrorMessage('Failed to save course. Please try again.')
      toast.error('Failed to save course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Đang tải dữ liệu khóa học...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-primary-600"
        >
          <FiArrowLeft className="mr-2" />
          Trở về
        </button>
        <h1 className="mt-2">{isEditMode ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'Cập nhật thông tin và cài đặt khóa học của bạn'
            : 'Điền thông tin chi tiết để tạo khóa học mới'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
          <div className="flex">
            <FiXCircle className="h-5 w-5 text-red-500 mr-2" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 border-l-4 border-green-500 bg-green-50 text-green-700">
          <div className="flex">
            <FiCheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-card rounded-lg p-6">
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* Course Title */}
          <div className="col-span-2">
            <label htmlFor="title" className="form-label">Tên khóa học <span className="text-red-500">*</span></label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g., Introduction to Web Development"
              {...register('title', { required: 'Course title is required' })}
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="form-label">Danh mục</label>
            <select id="category" className="form-input" {...register('category')}>
              <option value="">Chọn danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label htmlFor="level" className="form-label">Trình độ</label>
            <select id="level" className="form-input" {...register('level')}>
              <option value="">Chọn trình độ</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Requirements */}
          <div className="col-span-2">
            <label htmlFor="requirements" className="form-label">Yêu cầu khóa học</label>
          <ReactQuill
            id="requirements"
            theme="snow"
            value={requirements}
            onChange={setRequirements}
            placeholder="Học viên cần biết hoặc làm gì trước khi bắt đầu khóa học này?"
            className="bg-white [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:max-h-[250px] [&_.ql-editor]:overflow-y-auto"
          />

            {requirements.length < 10 && (
              <p className="form-error mt-2">Yêu cầu phải có ít nhất 10 ký tự</p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="form-label">Mô tả khóa học <span className="text-red-500">*</span></label>
            <ReactQuill
              id="description"
              theme="snow"
              value={description}
              onChange={setDescription}
              placeholder="Mô tả nội dung khóa học..."
              className="bg-white [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:max-h-[300px] [&_.ql-editor]:overflow-y-auto"
            />

            {description.length < 20 && (
              <p className="form-error mt-2">Mô tả phải có ít nhất 20 ký tự</p>
            )}
          </div>

          {/* Thumbnail */}
          <div className="col-span-2">
            <label htmlFor="thumbnail" className="form-label">Ảnh khóa học</label>
            <input
              id="thumbnail"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handleFileChange}
            />
            {thumbnailPreview && (
              <div className="mt-2">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  style={{ maxHeight: 150, borderRadius: 8, boxShadow: '0 2px 8px #ccc' }}
                />
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="form-label">Thời gian học dự kiến</label>
            <input
              id="duration"
              type="text"
              className="form-input"
              placeholder="e.g., 8 weeks"
              {...register('duration')}
            />
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language" className="form-label">Ngôn ngữ</label>
            <input
              id="language"
              type="text"
              className="form-input"
              {...register('language')}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="form-label">Giá gốc</label>
            <input
              id="price"
              type="number"
              step="0.01"
              className="form-input"
              {...register('price')}
            />
          </div>

          {/* Discount Price */}
          <div>
            <label htmlFor="discountPrice" className="form-label">Giá bán</label>
            <input
              id="discountPrice"
              type="number"
              step="0.01"
              className="form-input"
              {...register('discountPrice')}
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 border-t pt-6 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={saving}
          >
            <FiSave className="mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu khóa học'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CourseForm
