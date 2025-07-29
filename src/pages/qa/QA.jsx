import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  FiMessageSquare, 
  FiCheckCircle, 
  FiClock, 
  FiFileText,
  FiArrowLeft,
  FiSend,
  FiFilter
} from 'react-icons/fi'
import { fetchCourseById, fetchQA, answerQuestion } from '../../services/courseService'

const QA = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [filter, setFilter] = useState('all') // 'all', 'answered', 'unanswered'
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Fetch course and questions
        const [courseData, qaData] = await Promise.all([
          fetchCourseById(courseId),
          fetchQA(courseId)
        ])
        
        setCourse(courseData)
        setQuestions(qaData)
        
        // Set initial filtered questions
        filterQuestions(qaData, filter)
        
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [courseId, filter])
  
  // Filter questions based on selected filter
  const filterQuestions = (questions, filterType) => {
    if (filterType === 'all') {
      setFilteredQuestions(questions)
    } else if (filterType === 'answered') {
      setFilteredQuestions(questions.filter(q => q.answered))
    } else if (filterType === 'unanswered') {
      setFilteredQuestions(questions.filter(q => !q.answered))
    }
  }
  
  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    filterQuestions(questions, newFilter)
  }
  
  // Select a question to answer
  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question)
    setAnswerText(question.answer || '')
  }
  
  // Submit an answer
  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answerText.trim()) return
    
    try {
      setSubmitting(true)
      
      // Save the answer
      const updatedQuestion = await answerQuestion(
        courseId,
        selectedQuestion.id,
        answerText
      )
      
      // Update the questions list
      setQuestions(questions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      ))
      
      // Update filtered questions
      filterQuestions(
        questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q),
        filter
      )
      
      // Update selected question
      setSelectedQuestion(updatedQuestion)
      
    } catch (error) {
      console.error('Error submitting answer:', error)
      setError('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-primary-500">Loading Q&A data...</div>
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
      {/* Back button */}
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <FiArrowLeft className="mr-2" />
        Back to Course
      </button>
      
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl mb-1">{course.title}</h1>
          <p className="text-gray-600">
            Q&A - Respond to student questions
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="filter" className="text-sm text-gray-600">Filter:</label>
            <select
              id="filter"
              className="form-input"
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All Questions</option>
              <option value="unanswered">Unanswered</option>
              <option value="answered">Answered</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Q&A Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Questions List */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-card rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Questions</h2>
            </div>
            
            {filteredQuestions.length === 0 ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full mb-3">
                  <FiMessageSquare className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  {filter === 'all' 
                    ? 'No questions yet'
                    : filter === 'unanswered'
                      ? 'No unanswered questions'
                      : 'No answered questions'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredQuestions.map(question => (
                  <li 
                    key={question.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedQuestion?.id === question.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => handleSelectQuestion(question)}
                  >
                    <div className="px-4 py-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {question.studentName}
                        </span>
                        <span className={`ml-2 flex-shrink-0 ${
                          question.answered ? 'text-green-500' : 'text-amber-500'
                        }`}>
                          {question.answered ? <FiCheckCircle /> : <FiClock />}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {question.question}
                      </p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <FiFileText className="mr-1" />
                        <span className="truncate">{question.contentTitle}</span>
                        <span className="ml-2">
                          {new Date(question.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Question Detail */}
        <div className="md:col-span-2">
          {selectedQuestion ? (
            <div className="bg-white shadow-card rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Question from {selectedQuestion.studentName}
                  </h2>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedQuestion.answered 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedQuestion.answered ? 'Answered' : 'Waiting for Answer'}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <FiFileText className="mr-1" />
                  <span>
                    Lesson: {selectedQuestion.contentTitle}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {new Date(selectedQuestion.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Question
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-700">
                    {selectedQuestion.question}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Your Answer
                  </h3>
                  <textarea
                    rows="5"
                    className="form-input"
                    placeholder="Type your answer here..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  ></textarea>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      className="btn btn-primary flex items-center"
                      onClick={handleSubmitAnswer}
                      disabled={!answerText.trim() || submitting}
                    >
                      <FiSend className="mr-2" />
                      {submitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  </div>
                  
                  {selectedQuestion.answered && selectedQuestion.answerTimestamp && (
                    <div className="mt-3 text-xs text-gray-500 text-right">
                      {selectedQuestion.answer === answerText ? (
                        <span>
                          Answered on {new Date(selectedQuestion.answerTimestamp).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-amber-600">
                          *You've made changes since your last answer
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-card rounded-lg">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No question selected</h3>
                <p className="text-gray-500">
                  Select a question from the list to view and respond
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QA