import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from 'jwt-decode';
import "./styles/ViewResult.css";


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


function ViewResult() {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [resultData, setResultData] = useState([]);
  const [tab, setTab] = useState("individual");
  

  const [quizOptions, setQuizOptions] = useState([]);
  const [quizNameOptions, setQuizNameOptions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [attemptOptions, setAttemptOptions] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [examId, setExamId] = useState(null);
  const [academicLevel, setAcademicLevel] = useState('');
  const [parentName, setParentName] = useState('');
  const [allowedAcademicLevels, setAllowedAcademicLevels] = useState([]);

  const [quizLevel, setQuizLevel] = useState('');
  const [quizName, setQuizName] = useState('');
  const [maxScore, setMaxScore] = useState(0);
  const [username, setUsername] = useState('');
  const [role, setUserRole] = useState('');
  const [answers, setAnswers] = useState({});
  const [overallStats, setOverallStats] = useState(null);
  const [viewingResult, setViewingResult] = useState(false);

  const exportCSV = () => {
    if (!overallStats) return;
  
    let csvContent = "data:text/csv;charset=utf-8,";
  
    // Quiz info
    csvContent += `Quiz Name:,${overallStats.quiz_title}\n`;
    csvContent += `Total Participants:,${overallStats.total_participants}\n`;
    csvContent += `Average Score:,${overallStats.average_score}\n`;
    csvContent += `Median Score:,${overallStats.median_score}\n`;
    csvContent += `Full Score:,${overallStats.total_score}\n\n`;
  
    // Question stats header
    csvContent += "Question,Correct,Incorrect,Correct %\n";
  
    // Question stats rows
    (overallStats.question_stats || []).forEach((q) => {
      const total = q.correct_count + q.incorrect_count;
      const correctPercentage = total > 0 ? ((q.correct_count / total) * 100).toFixed(1) : "0.0";
      const row = `"${q.question_text.replace(/"/g, '""')}",${q.correct_count},${q.incorrect_count},${correctPercentage}%\n`;
      csvContent += row;
    });
  
    // Encode and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${overallStats.quiz_title}_overall_result.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printResult = () => {
    const printableContent = document.getElementById("printable-section");
    const newWindow = window.open('', '', 'height=500, width=800');
    newWindow.document.write('<html><head><title>Overall Performance</title></head><body>');
    newWindow.document.write(printableContent.innerHTML);  
    newWindow.document.write('</body></html>');
    newWindow.document.close();  
    newWindow.print();  
  };


  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username);
        setUserRole(decoded.role);  

        if (decoded.role === "parent") {
          setParentName(decoded.username)
          axios.get(`${apiUrl}/api/parent/${decoded.username}/students/`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          .then(async response => {
            const studentUsernames = response.data.students.map(s => s.username);
          
            // Fetch full user data from /api/users/
            const userResponse = await axios.get(`${apiUrl}/api/users/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          
            const studentUsers = userResponse.data.filter(user => studentUsernames.includes(user.username));
            const allLevels = new Set();
          
            studentUsers.forEach(user => {
              if (user.academicLevel) {
                user.academicLevel.split(',').forEach(level => {
                  allLevels.add(level.trim().toLowerCase().replace(' ', '_'));
                });
              }
            });
          
            setAllowedAcademicLevels(Array.from(allLevels));
          })
          .catch(error => {
            console.error("Error fetching assigned student levels:", error);
          });
        }

        axios.get(`${apiUrl}/api/users/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { username: decoded.username }
        })
        .then(response => {
          const user = response.data.find(u => u.username === decoded.username);
          if (user) {
            console.log("Matched user:", user);
            setAcademicLevel(user.academicLevel);  
          } else {
            console.warn("User not found in response.");
          }
        })
        .catch(error => {
          console.error('Error fetching user academic level:', error);
        });


      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
    
  }, []);

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
        // setAttemptOptions(response.data.attempts);
        const allAttempts = response.data.attempts;


        if (role === "student") {
          const studentAttempts = allAttempts.filter(attempt => attempt.username === username);
          setAttemptOptions(studentAttempts);
          if (studentAttempts.length === 1) {
            setSelectedAttempt(studentAttempts[0]);
            setExamId(studentAttempts[0].student_exam_id);
          } 
        } else if (role === "parent") {
          axios.get(`${apiUrl}/api/parent/${parentName}/students/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(studentResponse => {
            const assignedUsernames = studentResponse.data.students.map(s => s.username);
            const parentAttempts = allAttempts.filter(attempt => assignedUsernames.includes(attempt.username));
            setAttemptOptions(parentAttempts);
            console.log(parentAttempts)
          })
          .catch(error => {
            console.error("Error fetching assigned students:", error);
          });
        
        } else {
          setAttemptOptions(allAttempts);
        }
      })
      .catch(error => {
        console.error("Error fetching attempts:", error);
      });
    }, [quizId]);

const handleViewResult = async () => {
      if (tab === "overall") {
        await fetchOverallStats();
        setViewingResult(true);
        return;
      }
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
  
        setResultData(data.questions); // expected shape: [{questionId, question, ans_type, options}]
        setAnswers(data.answers);    // expected shape: { questionId: answer }
        setMaxScore(data.total_marks); 
        // setCurrentQuestionIndex(0);
        setViewingResult(true);
      } catch (error) {
        console.error("Error fetching exam result:", error);
        alert("Failed to view exam reuslt.");
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

    const fetchOverallStats = async () => {
      if (!quizId) {
        alert("Select a quiz first.");
        return;
      }
    
      const token = sessionStorage.getItem('access_token');
      try {
        const response = await axios.get(`${apiUrl}/api/quiz_overall_stats/${quizId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOverallStats(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching overall stats:", error);
        alert("Failed to fetch overall performance.");
      }
    };

  const totalScore = resultData.reduce((acc, cur) => acc + (cur.student_mark || 0), 0);


  const handleBack = () => {
    setViewingResult(false);
    // setCurrentQuestion(0);
  };


  const individualView = (
    <>
      <div style={{fontSize: "30px", fontWeight: "bold", textAlign: "center"}}>Individual Performance</div>

      <div className="quiz-info-grid">
            <label className="bold-text">Quiz Level: {quizLevel}</label>
            <label className="bold-text">Quiz Name: {quizName}</label>
            <label className="bold-text">Username: {username}</label>
            {selectedAttempt && (
            <label className="bold-text">Taken at: {formatDate(selectedAttempt.taken_at)}</label>
            )}
            <div style={{ textAlign: "center", fontWeight: "bold", marginTop: "1rem", fontSize:"20px" }}>
              Total Score: {totalScore} / {maxScore}
            </div>
            </div>

            <div className="quiz-container">
              {resultData.map((question, index) => (
                <div key={question.questionId} className="question-block">
                  <div className="quiz-header">
                    <h3>{`Question ${index + 1}: ${question.question}`}</h3>
                  </div>

                  <div className="options">
                    {renderInputForQuestion(question, index)}
                  </div>

                  <div className="question-feedback">
                    <p><strong>Correct Answer:</strong> {question.correct_answer || 'N/A'}</p>
                    <p><strong>Result:</strong>{" "}
                      {question.is_correct === true ? (
                        <span style={{ color: 'green' }}>✅ Correct</span>
                      ) : question.is_correct === false ? (
                        <span style={{ color: 'red' }}>❌ Incorrect</span>
                      ) : (
                        <span style={{ color: 'gray' }}>Not evaluated</span>
                      )}
                    </p>
                    <p>
                      <strong>Acquired Mark / Assigned Score:</strong> {question.student_mark || 0} / {question.assigned_score || 'N/A'}
                    </p>
                    <p><strong>Teacher Feedback:</strong></p>
                    <div className="teacher-comment" style={{ whiteSpace: 'pre-wrap', marginLeft: '10px' }}>
                      {question.teacher_comment || 'No feedback provided'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

      <button className="view-back-button" onClick={handleBack}>
        Back
      </button>
    </>
  );

  const overallView = (
    <div id="printable-section">
      <div style={{fontSize: "30px", fontWeight: "bold", textAlign: "center"}}>Overall Performance</div>


        {overallStats ? (
          <>
            <p><strong>Quiz Name:</strong> {overallStats.quiz_title}</p>
            <p><strong>Total Participants:</strong> {overallStats.total_participants}</p>
            <p><strong>Average Score:</strong> {overallStats.average_score}</p>
            <p><strong>Median Score:</strong> {overallStats.median_score}</p>
            <p><strong>Full Score:</strong> {overallStats.total_score}</p> 
            <h4>Question Stats:</h4>

            <table className="stats-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>✅ Correct</th>
                <th>❌ Incorrect</th>
                <th>✅ %</th>
              </tr>
            </thead>
            <tbody>
              {(overallStats.question_stats || []).map((q, i) => {
                const total = q.correct_count + q.incorrect_count;
                const correctPercentage = total > 0 ? ((q.correct_count / total) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={i}>
                    <td>{q.question_text}</td>
                    <td>{q.correct_count}</td>
                    <td>{q.incorrect_count}</td>
                    <td>{correctPercentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          </>
        ) : (
          <p>Loading overall stats...</p>
        )}

      <button className="view-back-button" onClick={handleBack}>Back</button>
      {/* <button className="view-back-button" onClick={() => alert("Exported successfully!")}> */}
      <button className="view-back-button" onClick={exportCSV}>
              Export Result
            </button>
            <button className="view-back-button" onClick={printResult}>
              Print Result
            </button>
            
    </div>
  );

  return (
    <div style={{ padding: "3rem" }}>
      {!viewingResult ? (
        <>
          <div>
            <button className="tab-button"
              onClick={() => setTab("individual")}
              style={{ background: tab === "individual" ? "darkorange" : "lightgrey"}}
            >
              Individual Performance
            </button>
            <button className="tab-button"
              onClick={() => setTab("overall")}
              style={{ background: tab === "overall" ? "darkorange" : "lightgrey"}}
            >
              Overall Performance
            </button>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label className="bold-text">Quiz Level</label>
              <select
                value={quizLevel}
                onChange={(e) => setQuizLevel(e.target.value)}
              >

                <option value="">Select Level</option>
                {(role === 'student' && academicLevel) ? (
                  academicLevel.split(',').map(level => (
                    <option key={level.trim()} value={level.trim().toLowerCase().replace(' ', '_')}>
                      {level.trim()}
                    </option>
                  ))
                ) : (role === 'parent' ? (
                  allowedAcademicLevels.map(level => (
                    <option key={level} value={level}>
                      {level.replace('_', ' ').toUpperCase()}
                    </option>
                  ))
                ) : (
                  ['kindergartens', 'year_1', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6',
                    'year_7', 'year_8', 'year_9', 'year_10', 'year_11', 'year_12']
                    .map(level => (
                      <option key={level} value={level}>
                        {level.replace('_', ' ').toUpperCase()}
                      </option>
                    ))
                ))}

              </select>

              <label className="bold-text">Quiz Name</label>
              <select className="select-box" value={quizName} onChange={(e) => {
                const selectedTitle = e.target.value;
                setQuizName(selectedTitle);
                setSelectedAttempt(null); 
                setExamId(null);

                const selectedQuiz = quizOptions.find(q => q.quiz_title === selectedTitle);
                setQuizId(selectedQuiz ? selectedQuiz.quiz_id : null);
              }}>
                  <option value="">Select Quiz</option>
                {quizNameOptions.map((name, idx) => (
                  <option key={idx} value={name}>{name}</option>
                ))}
              </select>




              {tab === "individual" && (
              <>
                <label className="bold-text">Select Attempt</label>
                <select
                  className="select-box"
                  value={selectedAttempt ? JSON.stringify(selectedAttempt) : ""}
                  onChange={(e) => {
                    const selectedOption = JSON.parse(e.target.value);
                    setSelectedAttempt(selectedOption);
                    setUsername(selectedOption.username);
                    setExamId(selectedOption.student_exam_id);
                  }}
                >
                  <option value="">Select Attempt</option>
                  {attemptOptions.map((attempt, idx) => (
                    <option key={idx} value={JSON.stringify(attempt)}>
                      {attempt.username} ({formatDate(attempt.taken_at)})
                    </option>
                  ))}
                </select>
              </>
            )}



          </div>
          
          <div style={{ marginTop: "1rem" }}>
            {/* <button onClick={() => setViewingResult(true)}>View Result</button> */}
            <button className="view-back-button" onClick={handleViewResult}>
              View Result</button>
            

          </div>
        </>
      ) : tab === "individual" ? (
        individualView
      ) : (
        overallView
      )}
    </div>
  );
};

export default ViewResult;
