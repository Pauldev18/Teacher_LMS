import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { set, useForm, useWatch } from 'react-hook-form'
import { FiSave, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { createCourse, fetchCourseById, updateCourse } from '../../services/courseService'
import { fetchCategories } from '../../services/categoryService'
import { fetchLevels } from '../../services/levelService'
import ImageUpload from '../../components/ImageUpload'

const CourseForm = () => {
  const { courseId } = useParams()
  const isEditMode = !!courseId
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('');
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const [categories, setCategories] = useState([])
  const [levels, setLevels] = useState([])
   useEffect(() => {
   
    const fetchData = async () => {
    
      setCategories(await fetchCategories())
      setLevels(await fetchLevels())
    }
    fetchData()
  }, [])

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    control,
    formState: { errors } 
  } = useForm()

  const imageUrl = useWatch({
    control,
    name: 'image',
    defaultValue: ''
  })
  
  // Fetch course data if in edit mode
  useEffect(() => {
    const loadCourse = async () => {
      if (!isEditMode) return
      
      try {
        setLoading(true)
        const courseData = await fetchCourseById(courseId)
        
        // Set form values
        reset(courseData)
        setDescription(courseData.description || '')
        setRequirements(courseData.requirements || '')
        
        // Set values for fields that need special handling
        setValue('title', courseData.title)
        setValue('image', courseData.image)
        setValue('duration', courseData.duration)
        setValue('level', courseData.level)
        
      } catch (error) {
        console.error('Error loading course:', error)
        setErrorMessage('Failed to load course data. Please try again. (Lỗi: ', error.message + ')')
      } finally {
        setLoading(false)
      }
    }
    
    loadCourse()
  }, [courseId, isEditMode, reset, setValue])
  
  const onSubmit = async (data) => {
    try {
      setSaving(true)
      setErrorMessage('')
      
      // Combine form data with rich text description
      const courseData = {
        ...data,
        description,
        requirements
      }
      
      let result
      
      if (isEditMode) {
        result = await updateCourse(courseId, courseData)
        console.log('Updated course:', result)
        setSuccessMessage('Course updated successfully!')
      } else {
           console.log('Created course:', courseData)
        result = await createCourse(courseData)
     
        setSuccessMessage('Course created successfully!')
      }
      
     
      setTimeout(() => {
        navigate(`/courses/${result.id}`)
      }, 1500)
      
    } catch (error) {
      console.error('Error saving course:', error)
      setErrorMessage('Failed to save course. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading course data...</div>
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
          Back
        </button>
        
        <h1 className="mt-2">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
        <p className="text-gray-600">
          {isEditMode 
            ? 'Update your course information and settings' 
            : 'Fill in the details to create a new course'}
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
            <label htmlFor="title" className="form-label">Course Title <span className="text-red-500">*</span></label>
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
            <label htmlFor="category" className="form-label">Category</label>
            <select id="category" className="form-input" {...register('category')}>
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label htmlFor="level" className="form-label">Level</label>
            <select id="level" className="form-input" {...register('level')}>
              <option value="">Select level</option>
              {levels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>



         {/* Requirements */}
<div className="col-span-2">
  <label htmlFor="requirements" className="form-label">Requirements</label>
  <ReactQuill
    id="requirements"
    theme="snow"
    value={requirements}
    onChange={setRequirements}
    placeholder="What should students know or do before starting this course?"
    className="bg-white"
  />
  {requirements.length < 10 && (
    <p className="form-error mt-2">Requirements should be at least 10 characters</p>
  )}
</div>



          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="form-label">Course Description <span className="text-red-500">*</span></label>
            <ReactQuill
              id="description"
              theme="snow"
              value={description}
              onChange={setDescription}
              placeholder="Describe your course content, objectives, and what students will learn..."
              className="bg-white"
            />
            {description.length < 20 && (
              <p className="form-error mt-2">Description should be at least 20 characters</p>
            )}
          </div>

          {/* Thumbnail */}
          <div className="col-span-2">
            <ImageUpload
              label="Thumbnail ảnh khóa học"
              value={thumbnailUrl}
              onChange={(url) => setValue('thumbnail', url)}
              accept="image/*"
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="form-label">Duration</label>
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
            <label htmlFor="language" className="form-label">Language</label>
            <input
              id="language"
              type="text"
              className="form-input"
              {...register('language')}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="form-label">Price</label>
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
            <label htmlFor="discountPrice" className="form-label">Discount Price</label>
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
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
            disabled={saving}
          >
            <FiSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Course'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CourseForm