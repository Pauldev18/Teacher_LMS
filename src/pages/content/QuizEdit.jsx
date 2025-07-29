import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiTrash2, FiPlus, FiX } from 'react-icons/fi'
import { fetchQuiz, saveQuiz, updateQuiz } from '../../services/courseService'
import { QUESTION_TYPES } from '../../data/mockData'

const QuizEdit = () => {
  const { courseId, quizId } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quizData = await fetchQuiz(courseId, quizId)
        setQuiz(quizData)
      } catch (error) {
        console.error('Error loading quiz:', error)
        setError('Failed to load quiz data')
      } finally {
        setLoading(false)
      }
    }
    
    loadQuiz()
  }, [quizId])
  
  const handleQuestionTypeChange = (questionId, newType) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => {
        if (q.id === questionId) {
          const baseQuestion = {
            ...q,
            type: newType,
          }
          
          switch (newType) {
            case QUESTION_TYPES.MULTIPLE_CHOICE:
              return {
                ...baseQuestion,
                options: [
                  { id: 'a', text: '' },
                  { id: 'b', text: '' },
                  { id: 'c', text: '' },
                  { id: 'd', text: '' }
                ],
                correctAnswer: ''
              }
            case QUESTION_TYPES.TRUE_FALSE:
              return {
                ...baseQuestion,
                correctAnswer: null
              }
            case QUESTION_TYPES.MULTIPLE_SELECT:
              return {
                ...baseQuestion,
                options: [
                  { id: 'a', text: '' },
                  { id: 'b', text: '' },
                  { id: 'c', text: '' },
                  { id: 'd', text: '' }
                ],
                correctAnswers: []
              }
            default:
              return baseQuestion
          }
        }
        return q
      })
    }))
  }
  
  const handleQuestionChange = (questionId, field, value) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }))
  }
  
  const handleOptionChange = (questionId, optionId, value) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map(opt => 
              opt.id === optionId ? { ...opt, text: value } : opt
            )
          }
        }
        return q
      })
    }))
  }
  
  const handleCorrectAnswerChange = (questionId, value) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => 
        q.id === questionId ? { ...q, correctAnswer: value } : q
      )
    }))
  }
  
  const toggleCorrectAnswer = (questionId, optionId) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => {
        if (q.id === questionId) {
          const correctAnswers = q.correctAnswers || []
          const newCorrectAnswers = correctAnswers.includes(optionId)
            ? correctAnswers.filter(id => id !== optionId)
            : [...correctAnswers, optionId]
          return { ...q, correctAnswers: newCorrectAnswers }
        }
        return q
      })
    }))
  }
  
  const addOption = (questionId) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => {
        if (q.id === questionId) {
          const newOptionId = String.fromCharCode(97 + q.options.length)
          return {
            ...q,
            options: [...q.options, { id: newOptionId, text: '' }]
          }
        }
        return q
      })
    }))
  }
  
  const removeOption = (questionId, optionId) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter(opt => opt.id !== optionId),
            ...(q.type === QUESTION_TYPES.MULTIPLE_SELECT && {
              correctAnswers: q.correctAnswers.filter(id => id !== optionId)
            })
          }
        }
        return q
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
    
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: [...prevQuiz.questions, newQuestion]
    }))
  }
  
  const removeQuestion = (questionId) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: prevQuiz.questions.filter(q => q.id !== questionId)
    }))
  }
  
  const handleSave = async () => {
    try {
      setSaving(true)
      console.log('Saving quiz:', quiz)
      await updateQuiz(courseId, quizId, quiz)
      navigate(`/courses/${courseId}/content`)
    } catch (error) {
      console.error('Error saving quiz:', error)
      setError('Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }
  
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
        onClick={() => navigate(`/courses/${courseId}/content`)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back to Content
      </button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Edit Quiz</h1>
        <p className="text-gray-600">
          Modify quiz questions and settings
        </p>
      </div>
      
      {/* Quiz Settings */}
      <div className="bg-white shadow-card rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quiz Settings</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="form-label">Time Limit (minutes)</label>
            <input
              type="number"
              className="form-input"
              value={quiz.timeLimit}
              onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <label className="form-label">Passing Score (%)</label>
            <input
              type="number"
              className="form-input"
              value={quiz.passingScore}
              onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) })}
            />
          </div>
        </div>
      </div>
      
      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="bg-white shadow-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Question {index + 1}</h3>
              <button
                onClick={() => removeQuestion(question.id)}
                className="text-red-500 hover:text-red-700"
              >
                <FiTrash2 className="h-5 w-5" />
              </button>
            </div>
            
            {/* Question Type */}
            <div className="mb-4">
              <label className="form-label">Question Type</label>
              <select
                className="form-input"
                value={question.type}
                onChange={(e) => handleQuestionTypeChange(question.id, e.target.value)}
              >
                <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Multiple Choice</option>
                <option value={QUESTION_TYPES.TRUE_FALSE}>True/False</option>
                <option value={QUESTION_TYPES.MULTIPLE_SELECT}>Multiple Select</option>
              </select>
            </div>
            
            {/* Question Text */}
            <div className="mb-4">
              <label className="form-label">Question</label>
              <textarea
                className="form-input"
                value={question.question}
                onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                rows="2"
              />
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
            {/* Question Options */}
            {question.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
              <div className="mb-4">
                <label className="form-label">Options</label>
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
                        placeholder={`Option ${option.id.toUpperCase()}`}
                      />
                      {question.options.length > 2 && (
                        <button
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
                    onClick={() => addOption(question.id)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    <FiPlus className="mr-1" />
                    Add Option
                  </button>
                )}
              </div>
            )}
            
            {question.type === QUESTION_TYPES.TRUE_FALSE && (
              <div className="mb-4">
                <label className="form-label">Correct Answer</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                      checked={question.correctAnswer === 'true'}
                      onChange={() => handleCorrectAnswerChange(question.id, 'true')}
                    />
                    True
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 mr-2"
                      checked={question.correctAnswer === 'false'}
                      onChange={() => handleCorrectAnswerChange(question.id, 'false')}
                    />
                    False
                  </label>
                </div>
              </div>
            )}
            
            {question.type === QUESTION_TYPES.MULTIPLE_SELECT && (
              <div className="mb-4">
                <label className="form-label">Options (Select all correct answers)</label>
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
                        value={option.text}
                        onChange={(e) => handleOptionChange(question.id, option.id, e.target.value)}
                        placeholder={`Option ${option.id.toUpperCase()}`}
                      />
                      {question.options.length > 2 && (
                        <button
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
                    onClick={() => addOption(question.id)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    <FiPlus className="mr-1" />
                    Add Option
                  </button>
                )}
              </div>
            )}
            
            {/* Points */}
            <div>
              <label className="form-label">Points</label>
              <input
                type="number"
                className="form-input w-24"
                value={question.points}
                onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Question Button */}
      <button
        onClick={addQuestion}
        className="btn btn-outline flex items-center mt-6"
      >
        <FiPlus className="mr-2" />
        Add Question
      </button>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Link
          to={`/courses/${courseId}/content`}
          className="btn btn-outline"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          className="btn btn-primary flex items-center"
          disabled={saving}
        >
          <FiSave className="mr-2" />
          {saving ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>
    </div>
  )
}

export default QuizEdit