import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./styles/EvaluateQuiz.css";

function formatDate(dateString) {
    const date = new Date(dateString);
  
    const pad = (num) => String(num).padStart(2, '0');
  
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1); 
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
  
    return `${yyyy}${mm}${dd}-${hh}:${min}:${ss}`;
  }

function EvaluateQuiz() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [quizData, setQuizData] = useState([]);
  const [error, setError] = useState(null);
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizNameOptions, setQuizNameOptions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [attemptOptions, setAttemptOptions] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [examId, setExamId] = useState(null);
  const [answers, setAnswers] = useState({});

  const [quizLevel, setQuizLevel] = useState('');
  const [quizName, setQuizName] = useState('');
  const [username, setUsername] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);


  useEffect(() => {
    const token = sessionStorage.getItem('token');
  
    axios.get(`${apiUrl}/api/list_quiz/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      const publishedQuizzes = response.data.filter(q => q.quiz_status === 'published');
      setQuizOptions(publishedQuizzes);  
    })
    .catch(error => {
      console.error("Error fetching quizzes:", error);
    });
  }, []);

  useEffect(() => {
      if (quizLevel && quizOptions.length > 0) {
        const filtered = quizOptions
          .filter(q => q.quiz_level === quizLevel)
          .map(q => q.quiz_title);
        setQuizNameOptions(filtered);
      } else {
        setQuizNameOptions([]);
      }
    }, [quizLevel, quizOptions]);
    
  useEffect(() => {
        if (!quizId) return;
      
        const token = sessionStorage.getItem('access_token');
      
        axios.get(`${apiUrl}/api/quiz_usernames/${quizId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          setAttemptOptions(response.data.attempts);
        })
        .catch(error => {
          console.error("Error fetching attempts:", error);
        });
      }, [quizId]);

  const handleLoadExam = async () => {
        if (!examId) {
          alert("Please select an attempt first.");
          return;
        }
      
        const token = sessionStorage.getItem('access_token');
        try {
          const response = await axios.get(`${apiUrl}/api/evaluate_quiz/${examId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
      
          const data = response.data;
          console.log('Fetched quiz data:', data);
    
          setQuizData(data.questions); // expected shape: [{questionId, question, ans_type, options}]
          setAnswers(data.answers);    // expected shape: { questionId: answer }
          setCurrentQuestionIndex(0);
        } catch (error) {
          console.error("Error fetching exam data:", error);
          alert("Failed to load exam data.");
        }
      };

      const renderInputForQuestion = (question, index) => {
        const selected = answers[question.questionId] || (question.ans_type === 'multiple_choice' ? [] : '');
      
        if (question.ans_type === 'textbox') {
          return <textarea value={selected} readOnly rows="4" cols="50" />;
        }
      
        if (question.ans_type === 'single_choice') {
          if (!Array.isArray(question.options)) {
            return <p>Error: Invalid options format for single choice question.</p>;
          }
          return question.options.map((option, i) => (
            <label key={i}>
              <input
                type="radio"
                name={`question-${index}`}
                value={option}
                checked={selected === option}
                readOnly
              />
              {option}
            </label>
          ));
        }
      
        if (question.ans_type === 'multiple_choice') {
          if (!Array.isArray(question.options)) {
            return <p>Error: Invalid options format for multiple choice question.</p>;
          }
          return question.options.map((option, i) => (
            <label key={i}>
              <input
                type="checkbox"
                name={`question-${index}`}
                value={option}
                checked={selected.includes(option)}
                readOnly
              />
              {option}
            </label>
          ));
        }
      
        return <p>Unsupported question type</p>;
      };
    
      const handleNextQuestion = () => {
        if (currentQuestionIndex < quizData.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      };
    
      const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
      };
    
      const renderQuestionNumbers = () => {
        return quizData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`question-number ${index === currentQuestionIndex ? 'active' : ''}`}
          >
            {index + 1}
          </button>
        ));
      };


      const handleSubmitFeedback = async () => {
        const token = sessionStorage.getItem('access_token');
        try {
          await axios.put(`${apiUrl}/api/submit_feedback/${examId}/`, {
            questions: quizData.map(q => ({
              questionId: q.questionId,
              student_mark: q.student_mark,
              teacher_comment: q.teacher_comment
            }))
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
      
          alert("Feedback and marks saved successfully!");
        } catch (err) {
          console.error("Failed to update feedback:", err);
          alert("Failed to save feedback.");
        }
      };
      
  
      


  if (error) return <div>{error}</div>;

  return (
    <div className="splitter">
        {/* Left Panel - Quiz Selection */}
        <div className="left-panel">
            <label className="bold-text">Quiz Level</label>
            <select
              value={quizLevel}
              onChange={(e) => setQuizLevel(e.target.value)}
            >
              <option value="">Select Level</option>
              {[
                'kindergartens', 'year_1', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6',
                'year_7', 'year_8', 'year_9', 'year_10', 'year_11', 'year_12'
                ].map(level => (
                <option key={level} value={level}>
                {level.replace('_', ' ').toUpperCase()}
                </option>
                ))}
            </select>

            <label className="bold-text">Quiz Name</label>
            <select className="select-box" value={quizName} onChange={(e) => {
              const selectedTitle = e.target.value;
              setQuizName(selectedTitle);

              const selectedQuiz = quizOptions.find(q => q.quiz_title === selectedTitle);
              setQuizId(selectedQuiz ? selectedQuiz.quiz_id : null);
            }}>
                <option value="">Select Quiz</option>
              {quizNameOptions.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>

            <label className="bold-text">Username</label>
            <select
            className="select-box"
            value={selectedAttempt ? JSON.stringify(selectedAttempt) : ""}
            onChange={(e) => {
                const selectedOption = JSON.parse(e.target.value);
                setSelectedAttempt(selectedOption);
                setUsername(selectedOption.username);
                setExamId(selectedOption.student_exam_id);

                setQuizData([]);
                setAnswers({});
                setCurrentQuestionIndex(0);

            }}
            >
            <option value="">Select Attempt</option>
            {attemptOptions.map((attempt, idx) => (
                <option key={idx} value={JSON.stringify(attempt)}>
                {attempt.username} ({formatDate(attempt.taken_at)})
                </option>
            ))}
            </select>
            <button className="load-button" onClick={handleLoadExam} disabled={!examId}>
            Load Exam
            </button>

        </div>

        {/* Right Panel - Question Review */}
        <div className="right-panel">
            <div className="quiz-info-grid">
            <label className="bold-text">Quiz Level: {quizLevel}</label>
            <label className="bold-text">Quiz Name: {quizName}</label>
            <label className="bold-text">Username: {username}</label>
            {selectedAttempt && (
            <label className="bold-text">Taken at: {formatDate(selectedAttempt.taken_at)}</label>
            )}
            </div>

<div className="evaluate-quiz-container">
          <div className="quiz-questions">
            {quizData.length === 0 || !quizData[currentQuestionIndex] ? (
              <p>Click "Load Exam" to display</p>
            ) : (
              <>
                <div className="quiz-header">
                  <h3>{`Question ${currentQuestionIndex + 1}:`}</h3>
                  <h3>{` ${quizData[currentQuestionIndex].question}`}</h3>
                </div>

                <div className="options">
                  {renderInputForQuestion(quizData[currentQuestionIndex], currentQuestionIndex)}
                  
                  <div className="question-feedback">
                    <label><strong>Correct Answer:</strong></label>
                    <div style={{marginLeft:"5px"}}>{quizData[currentQuestionIndex].correct_answer || 'N/A'} </div>
                    <label><strong>Acquired Mark / Assigned Score:</strong></label>
                    <input
                        type="number"
                        value={quizData[currentQuestionIndex].student_mark || ''}
                        onChange={(e) => {
                        const newQuizData = [...quizData];
                        newQuizData[currentQuestionIndex].student_mark = e.target.value;
                        setQuizData(newQuizData);
                        }}
                    />
                    <span className="assigned-score">
                    / {quizData[currentQuestionIndex].assigned_score || 'N/A'} 
                    </span>

                    <label><strong>Teacher Feedback:</strong></label>
                    <textarea
                        rows="3"
                        value={quizData[currentQuestionIndex].teacher_comment || ''}
                        onChange={(e) => {
                        const newQuizData = [...quizData];
                        newQuizData[currentQuestionIndex].teacher_comment = e.target.value;
                        setQuizData(newQuizData);
                        }}
                    />
                    </div>


                </div>

                <div className="question-navigation">
                  <button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                    Previous
                  </button>
                  {currentQuestionIndex === quizData.length - 1 ? (
                    <button onClick={handleSubmitFeedback}>Submit</button>
                  ) : (
                    <button onClick={handleNextQuestion}>Next</button>
                  )}
                </div>

                <div className="question-numbers">
                  <h3>Select Question:</h3>
                  {renderQuestionNumbers()}
                </div>
              </>
            )}
          </div>
        </div>


        </div>
    </div>
    );
}

export default EvaluateQuiz;
