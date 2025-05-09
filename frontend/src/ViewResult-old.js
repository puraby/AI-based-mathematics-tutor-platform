import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchResultByUserId, submitEvaluation, fetchUsers } from "./api/resultApi";

const ViewResult = () => {
  const [tab, setTab] = useState("individual");
  const [level, setLevel] = useState("Beginner");
  const [quiz, setQuiz] = useState("Math Quiz");
  const [username, setUsername] = useState("Student");
  const [viewingResult, setViewingResult] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [resultData, setResultData] = useState([]);
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (viewingResult) {
      fetchResultByUserId(userId)
        .then((data) => setResultData(data.results || data))
        .catch((err) => console.error("Error fetching result:", err));
    }
  }, [viewingResult]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    getUsers();
  }, []);

  const handleUserSelect = (e) => {
    const selectedId = e.target.value;
    setUserId(selectedId);
    const selectedUser = users.find(user => user.id.toString() === selectedId);
    if (selectedUser) {
      setUsername(selectedUser.username);
    }
  };

  const totalScore = resultData.reduce((acc, cur) => acc + (cur.mark || 0), 0);

  const handleBack = () => {
    setViewingResult(false);
    setCurrentQuestion(0);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        user_id: userId,
        quiz_name: quiz,
        level,
        results: resultData,
      };
      await submitEvaluation(payload);
      alert("Evaluation submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit evaluation");
    }
  };

  const individualView = (
    <>
      <h3>Individual Performance</h3>
      <p>
        <strong>Quiz Level:</strong> {level}
      </p>
      <p>
        <strong>Quiz Name:</strong> {quiz}
      </p>
      <p>
        <strong>Username:</strong> {username}
      </p>
      <p>
        <strong>Total Score:</strong> {totalScore}
      </p>
      <div>
        {resultData.map((_, i) => (
          <button key={i} onClick={() => setCurrentQuestion(i)}>
            {i + 1}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <p>
          <strong>Question:</strong> {resultData[currentQuestion]?.question}
        </p>
        <p>
          <strong>Answer:</strong> {resultData[currentQuestion]?.answer}
        </p>
        <label>
          <strong>Mark:</strong>{" "}
          <select
            value={resultData[currentQuestion]?.mark || 0}
            onChange={(e) => {
              const updated = [...resultData];
              updated[currentQuestion].mark = Number(e.target.value);
              setResultData(updated);
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          <strong>Comments:</strong>
          <br />
          <textarea
            value={resultData[currentQuestion]?.comments || ""}
            onChange={(e) => {
              const updated = [...resultData];
              updated[currentQuestion].comments = e.target.value;
              setResultData(updated);
            }}
          />
        </label>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
        >
          Previous
        </button>
        <button
          disabled={currentQuestion === resultData.length - 1}
          onClick={() => setCurrentQuestion((prev) => prev + 1)}
        >
          Next
        </button>
        <button onClick={handleSubmit}>Submit</button>
      </div>
      <button style={{ marginTop: "1rem" }} onClick={handleBack}>
        Back
      </button>
    </>
  );

  const overallView = (
    <>
      <h3>Overall Performance</h3>
      <p>
        <strong>Quiz Level:</strong> {level}
      </p>
      <p>
        <strong>Quiz Name:</strong> {quiz}
      </p>
      <p>
        <strong>Highest / Lowest / Avg / Median Score:</strong> 5 / 3 / 4 / 4
      </p>
      <button onClick={handleBack}>Back</button>
    </>
  );

  return (
    <div style={{ padding: "3rem" }}>
      {!viewingResult ? (
        <>
          <div>
            <button
              onClick={() => setTab("individual")}
              style={{ background: tab === "individual" ? "#ccc" : "white" }}
            >
              Individual Performance
            </button>
            <button
              onClick={() => setTab("overall")}
              style={{ background: tab === "overall" ? "#ccc" : "white" }}
            >
              Overall Performance
            </button>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <label>Quiz Level: </label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <label> Quiz Name: </label>
            <select value={quiz} onChange={(e) => setQuiz(e.target.value)}>
              <option value="Math Quiz">Math Quiz</option>
              <option value="Science Quiz">Science Quiz</option>
            </select>

            <label> Username: </label>
            <select value={userId} onChange={handleUserSelect}>
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button onClick={() => setViewingResult(true)}>View Result</button>
            <button onClick={() => alert("Exported successfully!")}>
              Export Result (for Teacher)
            </button>
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
