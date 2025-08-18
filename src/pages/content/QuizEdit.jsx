import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiTrash2, FiPlus, FiX } from 'react-icons/fi'
import { fetchQuiz, hasQuizSubmission, updateQuiz } from '../../services/courseService'
import { QUESTION_TYPES } from '../../enum/enum'
import { toast } from 'react-toastify'
import { confirmDelete } from '../../components/Utils/confirmDialog'

const QuizEdit = () => {
  const { courseId, quizId } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Lưu map lỗi theo questionId để highlight UI
  const [invalidMap, setInvalidMap] = useState({})

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await fetchQuiz(courseId, quizId)
        // Đảm bảo mảng questions tồn tại
        setQuiz({
          ...quizData,
          questions: Array.isArray(quizData?.questions) ? quizData.questions : []
        })
      } catch (err) {
        console.error('Error loading quiz:', err)
        setError('Failed to load quiz data')
      } finally {
        setLoading(false)
      }
    }
    loadQuiz()
  }, [quizId, courseId])

  // Đổi type câu hỏi → reset field liên quan
  const handleQuestionTypeChange = (questionId, newType) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q
        const base = { ...q, type: newType }
        switch (newType) {
          case QUESTION_TYPES.MULTIPLE_CHOICE:
            return {
              ...base,
              options: [
                { id: 'a', text: '' },
                { id: 'b', text: '' },
                { id: 'c', text: '' },
                { id: 'd', text: '' }
              ],
              correctAnswer: ''
            }
          case QUESTION_TYPES.TRUE_FALSE:
            return { ...base, correctAnswer: null, options: undefined, correctAnswers: undefined }
          case QUESTION_TYPES.MULTIPLE_SELECT:
            return {
              ...base,
              options: [
                { id: 'a', text: '' },
                { id: 'b', text: '' },
                { id: 'c', text: '' },
                { id: 'd', text: '' }
              ],
              correctAnswers: []
            }
          default:
            return base
        }
      })
    }))
  }

  const handleQuestionChange = (questionId, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q)
    }))
  }

  const handleOptionChange = (questionId, optionId, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q
        return {
          ...q,
          options: q.options.map(opt => opt.id === optionId ? { ...opt, text: value } : opt)
        }
      })
    }))
  }

  const handleCorrectAnswerChange = (questionId, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === questionId ? { ...q, correctAnswer: value } : q)
    }))
  }

  const toggleCorrectAnswer = (questionId, optionId) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q
        const current = Array.isArray(q.correctAnswers) ? q.correctAnswers : []
        const next = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId]
        return { ...q, correctAnswers: next }
      })
    }))
  }

  const addOption = (questionId) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q
        const used = (q.options || []).map(o => o.id)
        const newCode = Array.from({ length: 26 }, (_, i) => 97 + i) // a..z
          .find(code => !used.includes(String.fromCharCode(code)))
        const newId = String.fromCharCode(newCode ?? 122) // fallback 'z'
        return { ...q, options: [...(q.options || []), { id: newId, text: '' }] }
      })
    }))
  }

  const removeOption = (questionId, optionId) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q
        const nextOptions = (q.options || []).filter(o => o.id !== optionId)
        const next =
          q.type === QUESTION_TYPES.MULTIPLE_SELECT
            ? { ...q, options: nextOptions, correctAnswers: (q.correctAnswers || []).filter(id => id !== optionId) }
            : { ...q, options: nextOptions, correctAnswer: q.correctAnswer === optionId ? '' : q.correctAnswer }
        return next
      })
    }))
  }

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}`,
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
    setQuiz(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }))
  }

  const removeQuestion = (questionId) => {
    setQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== questionId) }))
  }

  // ---- VALIDATION giống QuizCreator ----
  const validateQuiz = (qz) => {
    const errors = {}
    const isBlank = (s) => !s || !String(s).trim()

    qz.questions.forEach((q) => {
      const err = {}

      // câu hỏi trống
      if (isBlank(q.question)) err.question = true

      if (q.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
        if (!q.options || q.options.length < 2) err.optionsMin = true
        if (q.options?.some(o => isBlank(o.text))) err.optionsEmpty = true
        if (!q.correctAnswer) err.correct = true
      }

      if (q.type === QUESTION_TYPES.TRUE_FALSE) {
        // hỗ trợ cả boolean và string 'true'/'false'
        const val = q.correctAnswer
        const picked = (val === true || val === false || val === 'true' || val === 'false')
        if (!picked) err.correct = true
      }

      if (q.type === QUESTION_TYPES.MULTIPLE_SELECT) {
        if (!q.options || q.options.length < 2) err.optionsMin = true
        if (q.options?.some(o => isBlank(o.text))) err.optionsEmpty = true
        if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) err.correct = true
      }

      if (Object.keys(err).length > 0) {
        errors[q.id] = err
      }
    })

    const firstInvalidIndex = qz.questions.findIndex(q => errors[q.id])
    return { valid: Object.keys(errors).length === 0, errors, firstInvalidIndex }
  }

 const handleSave = async () => {
  try {
    setSaving(true);
    setError(null);

    if (!quiz) throw new Error('Quiz is not loaded');

    // 1) Validate local như cũ
    const { valid, errors, firstInvalidIndex } = validateQuiz(quiz);
    setInvalidMap(errors);

    if (!valid) {
      const idx = (firstInvalidIndex ?? 0) + 1;
      toast.warning(`Vui lòng hoàn thiện câu hỏi #${idx} trước khi lưu.`);
      setSaving(false);
      return;
    }

    // 2) Check đã có người làm chưa
    const used = await hasQuizSubmission(quizId);
    if (used) {
      const ok = await confirmDelete({
        title: "Bài kiểm tra đã có người làm",
        text:
          "Nếu cập nhật sẽ dẫn tới hủy kết quả bài thi của thí sinh. Bạn có muốn tiếp tục không?",
        confirmText: "Tiếp tục cập nhật",
        cancelText: "Huỷ",
      });
      if (!ok) {
        setSaving(false);
        return;
      }
    }

    // 3) Gọi API cập nhật
    await updateQuiz(courseId, quizId, quiz);
    toast.success("Cập nhật bài kiểm tra thành công");
    navigate(`/courses/${courseId}/content`);
  } catch (err) {
    console.error("Error saving quiz:", err);
    setError("Failed to save quiz");
  } finally {
    setSaving(false);
  }
};
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading quiz...</div>
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(`/courses/${courseId}/content`)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Quay lại nội dung
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Chỉnh sửa bài kiểm tra</h1>
        <p className="text-gray-600">Sửa đổi câu hỏi và cài đặt bài kiểm tra</p>
      </div>

      {/* Quiz Settings */}
      <div className="bg-white shadow-card rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt bài kiểm tra</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">Tiêu đề</label>
            <input
              type="text"
              className="form-input"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Giới hạn thời gian (phút)</label>
            <input
              type="number"
              className="form-input"
              value={quiz.timeLimit}
              onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <div>
            <label className="form-label">Điểm đạt (%)</label>
            <input
              type="number"
              className="form-input"
              value={quiz.passingScore}
              onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) || 0 })}
              min={0}
              max={100}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, index) => {
          const qErr = invalidMap[question.id] || {}
          return (
            <div
              key={question.id}
              className={`bg-white shadow-card rounded-lg p-6 border ${Object.keys(qErr).length ? 'border-red-300' : 'border-transparent'}`}
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
                  onChange={(e) => handleQuestionTypeChange(question.id, e.target.value)}
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
                  className="form-input"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                  rows="2"
                />
                {qErr.question && (
                  <p className="text-xs text-red-500 mt-1">Câu hỏi không được để trống</p>
                )}
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <label className="form-label">Giải thích</label>
                <textarea
                  className="form-input"
                  value={question.explanation || ''}
                  onChange={(e) => handleQuestionChange(question.id, 'explanation', e.target.value)}
                  rows="2"
                  placeholder="Nhập giải thích cho câu hỏi (tuỳ chọn)"
                />
              </div>

              {/* Multiple Choice */}
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
                          onChange={() => handleCorrectAnswerChange(question.id, option.id)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={option.text}
                          onChange={(e) => handleOptionChange(question.id, option.id, e.target.value)}
                          placeholder="Nhập đáp án"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FiX className="h-4 w-4" />
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
                  {qErr.correct && (
                    <p className="text-xs text-red-500 mt-1">Hãy chọn một đáp án đúng</p>
                  )}
                  {qErr.optionsEmpty && (
                    <p className="text-xs text-red-500 mt-1">Không để trống nội dung các đáp án</p>
                  )}
                </div>
              )}

              {/* True/False */}
              {question.type === QUESTION_TYPES.TRUE_FALSE && (
                <div className="mb-4">
                  <label className="form-label">Đáp án đúng</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                        checked={question.correctAnswer === 'true'}
                        onChange={() => handleCorrectAnswerChange(question.id, 'true')}
                      />
                      Đúng
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                        checked={question.correctAnswer === 'false'}
                        onChange={() => handleCorrectAnswerChange(question.id, 'false')}
                      />
                      Sai
                    </label>
                  </div>
                  {qErr.correct && (
                    <p className="text-xs text-red-500 mt-1">Hãy chọn Đúng hoặc Sai</p>
                  )}
                </div>
              )}

              {/* Multiple Select */}
              {question.type === QUESTION_TYPES.MULTIPLE_SELECT && (
                <div className="mb-4">
                  <label className="form-label">Lựa chọn (Chọn tất cả các câu trả lời đúng)</label>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                          checked={Array.isArray(question.correctAnswers) && question.correctAnswers.includes(option.id)}
                          onChange={() => toggleCorrectAnswer(question.id, option.id)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={option.text}
                          onChange={(e) => handleOptionChange(question.id, option.id, e.target.value)}
                          placeholder="Nhập đáp án"
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FiX className="h-4 w-4" />
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
                  {qErr.correct && (
                    <p className="text-xs text-red-500 mt-1">Chọn ít nhất một đáp án đúng</p>
                  )}
                  {qErr.optionsEmpty && (
                    <p className="text-xs text-red-500 mt-1">Không để trống nội dung các đáp án</p>
                  )}
                </div>
              )}

              {/* Points */}
              <div>
                <label className="form-label">Điểm</label>
                <input
                  type="number"
                  className="form-input w-24"
                  value={question.points}
                  onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Question Button */}
      <button
        type="button"
        onClick={addQuestion}
        className="btn btn-outline flex items-center mt-6"
      >
        <FiPlus className="mr-2" />
        Thêm câu hỏi
      </button>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Link
          to={`/courses/${courseId}/content`}
          className="btn btn-outline"
        >
          Hủy
        </Link>
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary flex items-center"
          disabled={saving}
        >
          <FiSave className="mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
        </button>
      </div>
    </div>
  )
}

export default QuizEdit
