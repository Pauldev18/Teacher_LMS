import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  FiPlus, 
  FiTrash2, 
  FiSave, 
  FiArrowLeft, 
  FiCheck, 
  FiX, 
  FiMove,
  FiAlertCircle
} from 'react-icons/fi'
import { fetchQuiz, saveQuiz } from '../../services/courseService'
import { QUESTION_TYPES } from '../../enum/enum'
import { toast } from 'react-toastify'

const QuizCreator = () => {
  const { courseId, quizId } = useParams()
  const navigate = useNavigate()
   const [searchParams] = useSearchParams()

  const chapterId = searchParams.get('chapterId')
  const isNewQuiz = !quizId || quizId === 'new'
  
  const [loading, setLoading] = useState(!isNewQuiz)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [explanations, setExplanations] = useState([])
   const [questions, setQuestions] = useState([])
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(prev => !prev);
  const closeDropdown = () => setOpen(false);
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm()
  
 
  useEffect(() => {
    const loadQuiz = async () => {
      if (isNewQuiz) {
        // Set default values for a new quiz
        reset({
          title: '',
          description: '',
          timeLimit: 15,
          passingScore: 70,
        })
        setQuestions([
          {
            id: `new_q_${Date.now()}`,
            type: QUESTION_TYPES.MULTIPLE_CHOICE,
            question: '',
            options: [
              { id: 'a', text: '' },
              { id: 'b', text: '' },
              { id: 'c', text: '' },
              { id: 'd', text: '' }
            ],
            correctAnswer: '',
            points: 1
          }
        ])
        setLoading(false)
        return
      }
      
      try {
        const quizData = await fetchQuiz(quizId)
        reset({
          title: quizData.title,
          description: quizData.description,
          timeLimit: quizData.timeLimit,
          passingScore: quizData.passingScore,
        })
        setQuestions(quizData.questions || [])
        setExplanations(quizData.explanation || [])
      } catch (error) {
        console.error('Error loading quiz:', error)
        setError('Không tải được bài kiểm tra. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    
    loadQuiz()
  }, [quizId, isNewQuiz, reset])
  
  // Add a new question
  const addQuestion = (type = QUESTION_TYPES.MULTIPLE_CHOICE) => {
    const newQuestion = {
      id: `new_q_${Date.now()}`,
      type,
      question: '',
      points: 1
    }
    
    // Add options based on question type
    if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      newQuestion.options = [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ]
      newQuestion.correctAnswer = ''
    } else if (type === QUESTION_TYPES.TRUE_FALSE) {
      newQuestion.correctAnswer = null
    } else if (type === QUESTION_TYPES.MULTIPLE_SELECT) {
      newQuestion.options = [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ]
      newQuestion.correctAnswers = []
    }
    
    setQuestions([...questions, newQuestion])
  }
  

  const removeQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }
  

  const updateQuestion = (questionId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, [field]: value }
      }
      return q
    }))
  }
  
 
  const updateOption = (questionId, optionId, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const updatedOptions = q.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, text: value }
          }
          return opt
        })
        return { ...q, options: updatedOptions }
      }
      return q
    }))
  }
  
 // Chuyển đổi câu trả lời đúng cho nhiều lựa chọn
  const toggleCorrectAnswer = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const correctAnswers = q.correctAnswers || []
        const newCorrectAnswers = correctAnswers.includes(optionId)
          ? correctAnswers.filter(id => id !== optionId)
          : [...correctAnswers, optionId]
        return { ...q, correctAnswers: newCorrectAnswers }
      }
      return q
    }))
  }
  
  // Add option to multiple choice or multiple select question
  // const addOption = (questionId) => {
  //   setQuestions(questions.map(q => {
  //     if (q.id === questionId) {
  //       const newOptionId = String.fromCharCode(97 + q.options.length) // a, b, c, etc.
  //       return {
  //         ...q,
  //         options: [...q.options, { id: newOptionId, text: '' }]
  //       }
  //     }
  //     return q
  //   }))
  // }
  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const usedIds = q.options.map(opt => opt.id);
        // Tìm ký tự a → z chưa dùng
        const newCharCode = Array.from({ length: 26 }, (_, i) => 97 + i)
          .find(code => !usedIds.includes(String.fromCharCode(code)));
        const newOptionId = String.fromCharCode(newCharCode || 97);
  
        return {
          ...q,
          options: [...q.options, { id: newOptionId, text: '' }]
        };
      }
      return q;
    }));
  };
  
  // Remove option from multiple choice or multiple select question
  // const removeOption = (questionId, optionId) => {
  //   setQuestions(questions.map(q => {
  //     if (q.id === questionId) {
  //       return {
  //         ...q,
  //         options: q.options.filter(opt => opt.id !== optionId),
  //         ...(q.type === QUESTION_TYPES.MULTIPLE_SELECT && {
  //           correctAnswers: q.correctAnswers.filter(id => id !== optionId)
  //         })
  //       }
  //     }
  //     return q
  //   }))
  // }
  const removeOption = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const updatedOptions = q.options?.filter(opt => opt.id !== optionId) || [];
  
        const updatedCorrectAnswers = q.type === QUESTION_TYPES.MULTIPLE_SELECT && Array.isArray(q.correctAnswers)
          ? q.correctAnswers.filter(id => id !== optionId)
          : q.correctAnswers;
  
        return {
          ...q,
          options: updatedOptions,
          ...(q.type === QUESTION_TYPES.MULTIPLE_SELECT && {
            correctAnswers: updatedCorrectAnswers
          })
        };
      }
      return q;
    }));
  };
  
  const onSubmit = async (data) => {
    try {
      setSaving(true)
      setError(null)
      
      // Validate questions
      const invalidQuestions = questions.filter(q => {
        if (!q.question.trim()) return true
        if (q.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
          return !q.correctAnswer || q.options.some(opt => !opt.text.trim())
        }
        if (q.type === QUESTION_TYPES.TRUE_FALSE) {
          return q.correctAnswer === null
        }
        if (q.type === QUESTION_TYPES.MULTIPLE_SELECT) {
          return !q.correctAnswers?.length || q.options.some(opt => !opt.text.trim())
        }
        return false
      })
      
      if (invalidQuestions.length > 0) {
        setError('Vui lòng hoàn thành tất cả câu hỏi và câu trả lời trước khi lưu.')
        toast.warning('Vui lòng hoàn thành tất cả câu hỏi và câu trả lời trước khi lưu.')
        setSaving(false)
        return
      }
      
      const quizData = {
        ...data,
        id: isNewQuiz ? null : quizId,
        questions
      }
      console.log('Saving quiz data:', quizData)
      const result = await saveQuiz(courseId,chapterId, quizData)
      
      setSaveSuccess(true)
      navigate(`/courses/${courseId}/content`)
      toast.success("Tạo bài kiểm tra thành công");
    } catch (error) {
      console.error('Error saving quiz:', error)
      setError('Không lưu được bài kiểm tra. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Đang tải dữ liệu bài kiểm tra...</div>
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
       Quay lại nội dung
      </button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {isNewQuiz ? 'Tạo bài kiểm tra mới' : 'Chỉnh sửa bài kiểm tra'}
        </h1>
        <p className="text-gray-600">
          Thiết kế các bài đánh giá để kiểm tra sự hiểu biết của học sinh
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {saveSuccess && (
        <div className="mb-6 p-4 border-l-4 border-green-500 bg-green-50">
          <div className="flex">
            <FiCheck className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-sm text-green-700">
              {isNewQuiz ? 'Đã tạo bài kiểm tra thành công!' : 'Đã cập nhật bài kiểm tra thành công!'}
            </p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Quiz Details */}
        <div className="bg-white shadow-card rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cài đặt bài kiểm tra</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quiz Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="form-label">
                Tiêu đề bài kiểm tra <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                className="form-input"
                placeholder="Ví dụ: Bài kiểm tra cơ bản về HTML"
                {...register('title', { 
                  required: 'Tiêu đề bài kiểm tra là bắt buộc',
                  minLength: { value: 3, message: 'Tiêu đề phải có ít nhất 3 ký tự' }
                })}
              />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="form-label">
                Mô tả
              </label>
              <textarea
                id="description"
                rows="2"
                className="form-input"
                placeholder="Mô tả ngắn gọn về bài kiểm tra này..."
                {...register('description')}
              ></textarea>
            </div>
            
            {/* Time Limit */}
            <div>
              <label htmlFor="timeLimit" className="form-label">
                Giới hạn thời gian (phút)
              </label>
              <input
                id="timeLimit"
                type="number"
                className="form-input"
                min="1"
                max="180"
                {...register('timeLimit', { 
                  valueAsNumber: true,
                  min: { value: 1, message: 'Thời gian giới hạn tối thiểu là 1 phút' },
                  max: { value: 180, message: 'Thời gian giới hạn tối đa là 180 phút' }
                })}
              />
              {errors.timeLimit && <p className="form-error">{errors.timeLimit.message}</p>}
            </div>
            
            {/* Passing Score */}
            <div>
              <label htmlFor="passingScore" className="form-label">
                Điểm đạt (%)
              </label>
              <input
                id="passingScore"
                type="number"
                className="form-input"
                min="1"
                max="100"
                {...register('passingScore', { 
                  valueAsNumber: true,
                  min: { value: 1, message: 'Điểm đạt tối thiểu là 1%' },
                  max: { value: 100, message: 'Điểm đạt tối đa là 100%' }
                })}
              />
              {errors.passingScore && <p className="form-error">{errors.passingScore.message}</p>}
            </div>
          </div>
        </div>
        
        {/* Questions */}
        <div className="space-y-6 mb-6">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className="bg-white shadow-card rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Câu hỏi {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
              
              {/* Question Type */}
              <div className="mb-4">
                <label className="form-label">Loại câu hỏi</label>
                <select
                  className="form-input"
                  value={question.type}
                  onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                >
                  <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                  <option value={QUESTION_TYPES.TRUE_FALSE}>Đúng/Sai</option>
                  <option value={QUESTION_TYPES.MULTIPLE_SELECT}>Nhiều lựa chọn</option>
                </select>
              </div>
              
              {/* Question Text */}
              <div className="mb-4">
                <label className="form-label">Câu hỏi</label>
                <textarea
                  rows="2"
                  className="form-input"
                  placeholder="Nhập câu hỏi của bạn..."
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                ></textarea>
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <label className="form-label">Giải thích</label>
                <textarea
                  rows="2"
                  className="form-input"
                  placeholder="Nhập giải thích cho câu hỏi (nếu có)..."
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                ></textarea>
              </div>
              {/* Question-type specific content */}
              {question.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
                <div className="mb-4">
                  <label className="form-label">Lựa chọn</label>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                          checked={question.correctAnswer === option.id}
                          onChange={() => updateQuestion(question.id, 'correctAnswer', option.id)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nhập đáp án"
                          value={option.text}
                          onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {question.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <FiPlus className="mr-1" />
                      Thêm lựa chọn
                    </button>
                  )}
                  {!question.correctAnswer && (
                    <p className="text-xs text-red-500 mt-1">
                      Chọn câu trả lời đúng bằng cách nhấp vào nút radio
                    </p>
                  )}
                </div>
              )}
              
              {question.type === QUESTION_TYPES.TRUE_FALSE && (
                <div className="mb-4">
                  <label className="form-label">Câu trả lời đúng</label>
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.id}-true`}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                        checked={question.correctAnswer === true}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', true)}
                      />
                      <label htmlFor={`${question.id}-true`}>Đúng</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.id}-false`}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                        checked={question.correctAnswer === false}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', false)}
                      />
                      <label htmlFor={`${question.id}-false`}>Sai</label>
                    </div>
                  </div>
                </div>
              )}
              
              {question.type === QUESTION_TYPES.MULTIPLE_SELECT && (
                <div className="mb-4">
                  <label className="form-label">Lựa chọn (Chọn tất cả các câu trả lời đúng)</label>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                          checked={question.correctAnswers?.includes(option.id)}
                          onChange={() => toggleCorrectAnswer(question.id, option.id)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nhập đáp án"
                          value={option.text}
                          onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {question.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <FiPlus className="mr-1" />
                      Thêm lựa chọn
                    </button>
                  )}
                  {(!question.correctAnswers || question.correctAnswers.length === 0) && (
                    <p className="text-xs text-red-500 mt-1">
                      Chọn ít nhất một câu trả lời đúng
                    </p>
                  )}
                </div>
              )}
              
              {/* Points */}
              <div className="mb-2">
                <label className="form-label">Điểm</label>
                <input
                  type="number"
                  className="form-input w-24"
                  min="1"
                  max="10"
                  value={question.points}
                  onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Question Button */}
        <div className="flex mb-6 relative">
      <div className="dropdown">
        <button
          type="button"
          className="btn btn-outline flex items-center"
          onClick={toggleDropdown}
        >
          <FiPlus className="mr-2" />
          Thêm câu hỏi
        </button>

        {open && (
          <div
            className="absolute left-0 bottom-full mb-2 w-60 bg-white shadow-lg rounded-md py-1 z-10"
            onMouseLeave={closeDropdown} // Optional: tự ẩn khi rời khỏi
          >
            <button
              type="button"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                addQuestion(QUESTION_TYPES.MULTIPLE_CHOICE);
                closeDropdown();
              }}
            >
             Câu hỏi trắc nghiệm
            </button>
            <button
              type="button"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                addQuestion(QUESTION_TYPES.TRUE_FALSE);
                closeDropdown();
              }}
            >
              Câu hỏi Đúng/Sai
            </button>
            <button
              type="button"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                addQuestion(QUESTION_TYPES.MULTIPLE_SELECT);
                closeDropdown();
              }}
            >
              Câu hỏi nhiều lựa chọn
            </button>
          </div>
        )}
      </div>
    </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/courses/${courseId}/content`)}
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
            {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuizCreator