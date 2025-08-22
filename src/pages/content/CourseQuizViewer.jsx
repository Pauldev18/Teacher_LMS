// src/pages/admin/CourseQuizViewer.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import AxiosClient from "../../services/axiosInstance";

const getQuizzesByCourse = (courseId) =>
  AxiosClient.get(`/api/courses-quizs/${courseId}/quizzes`);

const getResultsByQuiz = (quizId) =>
  AxiosClient.get(`/api/courses-quizs/${quizId}/results`);

const getQuizByQuizIdAndUser = (quizId, userId) =>
  AxiosClient.get(`/api/quizzes/${quizId}/${userId}`);

export default function CourseQuizViewer() {
  const { courseId } = useParams();

  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState("");

  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [viewerData, setViewerData] = useState(null);
  const [loadingViewer, setLoadingViewer] = useState(false);

  // Load quizzes theo courseId
  useEffect(() => {
    if (!courseId) return;
    setLoadingQuizzes(true);
    getQuizzesByCourse(courseId)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setQuizzes(list);
        setSelectedQuizId(""); // để user tự chọn
        setResults([]);
        setSelectedUserId("");
        setViewerData(null);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Không tải được danh sách quiz.");
      })
      .finally(() => setLoadingQuizzes(false));
  }, [courseId]);

  // Khi đổi quiz -> load danh sách người làm
  useEffect(() => {
    if (!selectedQuizId) {
      setResults([]);
      setSelectedUserId("");
      setViewerData(null);
      return;
    }
    setLoadingResults(true);
    setResults([]);
    setSelectedUserId("");
    setViewerData(null);
    getResultsByQuiz(selectedQuizId)
      .then(({ data }) => {
        setResults(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Không tải được danh sách kết quả.");
      })
      .finally(() => setLoadingResults(false));
  }, [selectedQuizId]);

  const handleView = async (userId) => {
    if (!selectedQuizId || !userId) return;
    try {
      setLoadingViewer(true);
      const { data } = await getQuizByQuizIdAndUser(selectedQuizId, userId);
      setViewerData(data || null);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được bài thi.");
    } finally {
      setLoadingViewer(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* TOP BAR: 2 dropdown */}
     <div className="sticky top-0 z-0 border-b bg-white/95 backdrop-blur">

        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Dropdown Quiz */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Chọn Quiz
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                disabled={loadingQuizzes || quizzes.length === 0}
              >
                {loadingQuizzes ? (
                  <option>Đang tải...</option>
                ) : (
                  <>
                    <option value="">-- Chọn quiz --</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} {q.timeLimit ? `• ${q.timeLimit}p` : ""}{" "}
                        {q.passingScore ? `• ≥${q.passingScore}%` : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500">Course ID: {courseId}</p>
            </div>

            {/* Dropdown User */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Chọn người làm bài
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
                value={selectedUserId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUserId(val);
                  if (val) handleView(val);
                }}
                disabled={!selectedQuizId || loadingResults || results.length === 0}
              >
                {!selectedQuizId ? (
                  <option>Chọn quiz trước</option>
                ) : loadingResults ? (
                  <option>Đang tải...</option>
                ) : results.length === 0 ? (
                  <option>Chưa có ai làm bài</option>
                ) : (
                  <>
                    <option value="">-- Chọn người --</option>
                    {results.map((r) => (
                      <option key={`${r.userId}-${r.resultId ?? r.completedAt ?? "x"}`} value={r.userId}>
                        {r.userName} • Điểm: {r.score ?? "--"} {r.passed ? "✓" : "✗"}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* VIEWER CENTERED */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {loadingViewer ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Đang tải bài thi...
            </div>
          ) : !viewerData ? (
            <div className="text-center text-gray-500 py-16">
              Hãy chọn Quiz và Người làm bài ở trên để xem bài thi.
            </div>
          ) : (
            <QuizViewer quizResponse={viewerData} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ================== VIEWER (read-only) ================== */
function QuizViewer({ quizResponse }) {
  const quiz = quizResponse;
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const quizCompleted = true;
  const score = quiz?.userQuizResult?.score ?? 0;

  useEffect(() => {
    if (!quiz?.questions || !quiz?.userQuizResult?.userAnswers) return;

    const map = {};
    const ua = quiz.userQuizResult.userAnswers;

    ua.forEach((ans) => {
      const q = quiz.questions.find((x) => x.id === ans.questionId);
      if (!q) return;

      let sel = ans.selectedAnswers;

      if (q.type === "multiple_select") {
        let ids = Array.isArray(sel)
          ? sel
          : String(sel || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
        map[q.id] = ids
          .map((id) => q.options.findIndex((opt) => opt.id === id))
          .filter((i) => i >= 0);
      } else if (q.type === "multiple_choice") {
        const idx = q.options.findIndex((opt) => opt.id === String(sel));
        map[q.id] = idx >= 0 ? idx : null;
      } else if (q.type === "true_false") {
        const val =
          sel === "1" || sel === 1 || sel === true
            ? true
            : sel === "0" || sel === 0 || sel === false
            ? false
            : null;
        map[q.id] = val;
      }
    });

    setSelectedAnswers(map);
  }, [quiz]);

  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return "--:--";
    const sec = minutes * 60;
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  if (!quiz) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200">
      <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-2xl font-semibold">{quiz.title}</h3>
          <p className="text-sm text-gray-600">{quiz.description}</p>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-5 h-5 mr-1" />
          <span>Thời gian: {formatTime(quiz.timeLimit)}</span>
        </div>
      </div>

      <div className="p-5">
        {quiz.questions.map((question, idx) => (
          <QuestionReview
            key={question.id}
            index={idx}
            question={question}
            selectedAnswers={selectedAnswers}
            quizCompleted={quizCompleted}
          />
        ))}

        <div className="mt-6 p-4 bg-green-50 rounded-lg text-green-800 text-center border border-green-200">
          <h4 className="text-xl font-bold">Điểm: {score}</h4>
          <p className="mt-1">
            {quiz?.userQuizResult?.passed ? (
              <span className="text-green-700 font-semibold">Đạt</span>
            ) : (
              <span className="text-red-700 font-semibold">Trượt</span>
            )}
          </p>
          {quiz?.userQuizResult?.completedAt && (
            <p className="text-xs text-gray-600 mt-1">
              Nộp lúc: {new Date(quiz.userQuizResult.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Block hiển thị câu hỏi/đáp án ============ */
function QuestionReview({ index, question, selectedAnswers, quizCompleted }) {
  const isAnswerSelected = (q, answerIndex, type) => {
    const selected = selectedAnswers[q.id];
    if (selected == null) return false;
    switch (type) {
      case "multiple_choice":
        return selected === answerIndex;
      case "multiple_select":
        return Array.isArray(selected) && selected.includes(answerIndex);
      case "true_false":
        return selected === (answerIndex === 0);
      default:
        return false;
    }
  };

  const isCorrectAnswer = (q, answerIndex) => {
    if (q.type === "multiple_choice") {
      const correctIdx = q.options.findIndex((opt) => opt.id === q.correctAnswer);
      return correctIdx === answerIndex;
    }
    if (q.type === "true_false") {
      return (q.correctAnswer === "true" || q.correctAnswer === true) === (answerIndex === 0);
    }
    if (q.type === "multiple_select") {
      const correctIdxs = (q.correctAnswers || []).map((id) =>
        q.options.findIndex((opt) => opt.id === id)
      );
      const selected = selectedAnswers[q.id] || [];
      return correctIdxs.includes(answerIndex) && selected.includes(answerIndex);
    }
    return false;
  };

  const renderTrueFalseOption = (q, option, idx) => {
    const isSelected = isAnswerSelected(q, idx, "true_false");
    const isCorrect = isCorrectAnswer(q, idx);

    let bg = "bg-white hover:bg-gray-50";
    if (quizCompleted) {
      if (isCorrect && isSelected) bg = "bg-green-100 border-green-500";
      else if (isCorrect && !isSelected) bg = "bg-blue-100 border-blue-500";
      else if (isSelected && !isCorrect) bg = "bg-red-100 border-red-500";
    } else if (isSelected) {
      bg = "bg-blue-50 border-blue-500";
    }

    return (
      <div
        key={idx}
        className={`border rounded-lg p-4 mb-2 ${quizCompleted ? "" : "cursor-pointer"} ${bg}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[15px]">{option ? "True" : "False"}</span>
          {quizCompleted && isCorrect && <Check className="text-green-500 w-5 h-5" />}
          {quizCompleted && isSelected && !isCorrect && <X className="text-red-500 w-5 h-5" />}
        </div>
      </div>
    );
  };

  const renderMultipleChoiceOption = (q, option, idx) => {
    const isSelected = isAnswerSelected(q, idx, "multiple_choice");
       const isCorrect = isCorrectAnswer(q, idx);

    let bg = "bg-white hover:bg-gray-50";
    if (quizCompleted) {
      if (isCorrect && isSelected) bg = "bg-green-100 border-green-500";
      else if (isCorrect && !isSelected) bg = "bg-blue-100 border-blue-500";
      else if (isSelected && !isCorrect) bg = "bg-red-100 border-red-500";
    } else if (isSelected) {
      bg = "bg-blue-50 border-blue-500";
    }

    return (
      <div key={idx} className={`border rounded-lg p-4 mb-2 ${bg}`}>
        <div className="flex items-center justify-between">
          <span className="text-[15px]">{option.text}</span>
          {quizCompleted && isCorrect && <Check className="text-green-500 w-5 h-5" />}
          {quizCompleted && isSelected && !isCorrect && <X className="text-red-500 w-5 h-5" />}
        </div>
      </div>
    );
  };

  const renderMultipleSelectOption = (q, option, idx) => {
    const selected = isAnswerSelected(q, idx, "multiple_select");
    const correctIdxs = (q.correctAnswers || []).map((id) =>
      q.options.findIndex((opt) => opt.id === id)
    );
    const isCorrect = correctIdxs.includes(idx);

    let bg = "bg-white hover:bg-gray-50";
    if (quizCompleted) {
      if (selected && isCorrect) bg = "bg-green-100 border-green-500";
      else if (selected && !isCorrect) bg = "bg-red-100 border-red-500";
      else if (!selected && isCorrect) bg = "bg-blue-100 border-blue-500";
    } else if (selected) {
      bg = "bg-blue-50 border-blue-500";
    }

    return (
      <div key={idx} className={`border rounded-lg p-4 mb-2 ${bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-5 h-5 border rounded mr-2 flex items-center justify-center ${
                selected ? "bg-blue-600 border-blue-600" : "border-gray-300"
              }`}
            >
              {selected && <Check className="text-white w-3 h-3" />}
            </div>
            <span className="text-[15px]">{option.text}</span>
          </div>
          {quizCompleted && selected && !isCorrect && <X className="text-red-500 w-5 h-5" />}
          {quizCompleted && isCorrect && <Check className="text-green-500 w-5 h-5" />}
        </div>
      </div>
    );
  };

  const correctIndexes = useMemo(() => {
    if (question.type === "multiple_choice") {
      return [question.options.findIndex((opt) => opt.id === question.correctAnswer)].filter(
        (i) => i >= 0
      );
    }
    if (question.type === "true_false") {
      return [question.correctAnswer === "true" || question.correctAnswer === true ? 0 : 1];
    }
    if (question.type === "multiple_select") {
      return (question.correctAnswers || [])
        .map((id) => question.options.findIndex((opt) => opt.id === id))
        .filter((i) => i >= 0);
    }
    return [];
  }, [question]);

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h4 className="text-lg font-semibold">
          {index + 1}. {question.question}
        </h4>
      </div>

      <div className="mb-4">
        {question.type === "true_false" && (
          <div>{[true, false].map((opt, i) => renderTrueFalseOption(question, opt, i))}</div>
        )}
        {question.type === "multiple_choice" && (
          <div>{question.options.map((opt, i) => renderMultipleChoiceOption(question, opt, i))}</div>
        )}
        {question.type === "multiple_select" && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Chọn tất cả đáp án đúng</p>
            {question.options.map((opt, i) => renderMultipleSelectOption(question, opt, i))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border">
        <h5 className="text-sm font-semibold text-gray-700">Đáp án đúng:</h5>
        {question.type === "true_false" ? (
          <p className="text-gray-700">
            {(question.correctAnswer === "true" || question.correctAnswer === true) ? "True" : "False"}
          </p>
        ) : (
          <ul className="list-disc list-inside text-gray-700">
            {correctIndexes.map((i) => (
              <li key={i}>{question.options[i]?.text}</li>
            ))}
          </ul>
        )}

        {selectedAnswers[question.id] !== undefined &&
        selectedAnswers[question.id] !== null ? (
          <div className="mt-4">
            <h6 className="text-sm font-semibold text-gray-700">Đáp án của học viên:</h6>
            {question.type === "multiple_select" ? (
              <ul className="list-disc list-inside text-gray-700">
                {Array.isArray(selectedAnswers[question.id]) &&
                selectedAnswers[question.id].length > 0 ? (
                  selectedAnswers[question.id].map((idx) => (
                    <li key={idx}>{question.options[idx]?.text}</li>
                  ))
                ) : (
                  <li>Không có đáp án</li>
                )}
              </ul>
            ) : (
              <p className="text-gray-700">
                {question.type === "multiple_choice"
                  ? question.options[selectedAnswers[question.id]]?.text ?? "Không có đáp án"
                  : selectedAnswers[question.id] === true
                  ? "True"
                  : selectedAnswers[question.id] === false
                  ? "False"
                  : "Không có đáp án"}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <h6 className="text-sm font-semibold text-gray-700">Đáp án của học viên:</h6>
            <p className="text-gray-700">Không có đáp án</p>
          </div>
        )}

        {question.explanation && (
          <div className="mt-4">
            <h6 className="text-sm font-semibold text-gray-700">Giải thích:</h6>
            <p className="text-gray-700">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
