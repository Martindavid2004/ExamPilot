import React, { useState, useEffect, useRef, useReducer } from "react";
import "./homepage.css";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const initialState = {
  isLoggedIn: false,
  currentPage: "dashboard",
  exams: [],
  upcomingExams: [],
  completedExams: [],
  examFolders: [], // Changed from timetables to examFolders
  editingTimetable: null,
  currentUserId: "admin", // Default user ID for now
};

function appReducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, isLoggedIn: true };
    case "LOGOUT":
      return { ...state, isLoggedIn: false, currentPage: "dashboard" };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "ADD_EXAM":
      return {
        ...state,
        upcomingExams: [...state.upcomingExams, action.payload],
      };
    case "SET_UPCOMING_EXAMS":
      return { ...state, upcomingExams: action.payload };
    case "SET_COMPLETED_EXAMS":
      return { ...state, completedExams: action.payload };
    case "SET_EXAM_FOLDERS":
      return { ...state, examFolders: action.payload };
    case "ADD_EXAM_FOLDER":
      // Avoid duplicates by folderName (case-insensitive) - add null checks
      if (
        action.payload &&
        action.payload.folderName &&
        state.examFolders.some(
          (f) =>
            f &&
            f.folderName &&
            f.folderName.toLowerCase() ===
              action.payload.folderName.toLowerCase()
        )
      ) {
        return {
          ...state,
          examFolders: state.examFolders.map((f) =>
            f &&
            f.folderName &&
            f.folderName.toLowerCase() ===
              action.payload.folderName.toLowerCase()
              ? action.payload
              : f
          ),
        };
      }
      return { ...state, examFolders: [...state.examFolders, action.payload] };
    case "UPDATE_EXAM_FOLDER":
      return {
        ...state,
        examFolders: state.examFolders.map((f) =>
          f.id === action.payload.id ? action.payload : f
        ),
      };
    case "DELETE_EXAM_FOLDER":
      return {
        ...state,
        examFolders: state.examFolders.filter((f) => f.id !== action.payload),
      };
    case "CLEAR_ALL_TIMETABLES":
      return { ...state, examFolders: [] };
    case "SET_EDITING_TIMETABLE":
      return { ...state, editingTimetable: action.payload };
    default:
      return state;
  }
}

// Reducer for drag-and-drop timetable state
function timetableReducer(state, action) {
  switch (action.type) {
    case "REORDER":
      // For the new table format, we'll handle reordering differently
      return state;
    case "SET_TIMETABLE":
      return action.payload;
    case "UPDATE_CELL":
      const { dayIndex, session, field, value } = action.payload;
      const newState = [...state];
      if (newState[dayIndex] && newState[dayIndex][session]) {
        newState[dayIndex][session][field] = value;
      }
      return newState;
    default:
      return state;
  }
}

const Homepage = () => {
  const [appState, dispatch] = useReducer(appReducer, initialState);

  // Load exam folders from backend on component mount
  useEffect(() => {
    const fetchExamFolders = async () => {
      const auth = localStorage.getItem("auth");
      if (auth) {
        try {
          const response = await fetch(
            `http://localhost:8084/api/exam-folders/user/${appState.currentUserId}`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
              },
            }
          );
          if (response.ok) {
            const examFolders = await response.json();
            dispatch({ type: "SET_EXAM_FOLDERS", payload: examFolders });
          } else {
            // Fallback to localStorage if backend is not available
            const storedTimetables = JSON.parse(
              localStorage.getItem("examTimetables") || "[]"
            );
            // Convert old structure to new folder structure
            const folders = storedTimetables.map((timetable) => ({
              id: timetable.id,
              userId: appState.currentUserId,
              folderName: timetable.tableName,
              description: `Converted from legacy timetable`,
              timetables: [timetable],
              createdAt: timetable.createdAt,
              updatedAt: timetable.updatedAt,
            }));
            dispatch({ type: "SET_EXAM_FOLDERS", payload: folders });
          }
        } catch (error) {
          console.error("Failed to fetch exam folders from backend:", error);
          // Fallback to localStorage if backend is not available
          const storedTimetables = JSON.parse(
            localStorage.getItem("examTimetables") || "[]"
          );
          // Convert old structure to new folder structure
          const folders = storedTimetables.map((timetable) => ({
            id: timetable.id,
            userId: appState.currentUserId,
            folderName: timetable.tableName,
            description: `Converted from legacy timetable`,
            timetables: [timetable],
            createdAt: timetable.createdAt,
            updatedAt: timetable.updatedAt,
          }));
          dispatch({ type: "SET_EXAM_FOLDERS", payload: folders });
        }
      }
    };
    fetchExamFolders();
  }, [appState.currentUserId]);

  const handleLogin = () => {
    dispatch({ type: "LOGIN" });
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    dispatch({ type: "LOGOUT" });
  };

  const refreshExamFolders = async () => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      try {
        const response = await fetch(
          `http://localhost:8084/api/exam-folders/user/${appState.currentUserId}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );
        if (response.ok) {
          const examFolders = await response.json();
          dispatch({ type: "SET_EXAM_FOLDERS", payload: examFolders });
        }
      } catch (error) {
        console.error("Failed to refresh exam folders from backend:", error);
      }
    }
  };

  const handleClearAllTimetables = () => {
    if (
      window.confirm(
        "This will remove ALL stored timetables locally. Continue?"
      )
    ) {
      dispatch({ type: "CLEAR_ALL_TIMETABLES" });
      localStorage.removeItem("examFolders");
      localStorage.removeItem("examTimetables");
    }
  };

  const setPage = (page) => {
    dispatch({ type: "SET_PAGE", payload: page });
    // Refresh exam folders when navigating to timetables page
    if (page === "upcoming-exams") {
      refreshExamFolders();
    }
  };

  const handleCreateExam = (exam) => {
    dispatch({ type: "ADD_EXAM", payload: exam });
  };

  const handleCreateTimetable = async (timetableData) => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      try {
        // Use the new endpoint that creates a folder for each timetable
        const response = await fetch(
          `http://localhost:8084/api/exam-folders/create-with-timetable?userId=${appState.currentUserId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(timetableData),
          }
        );

        if (response.ok) {
          const newFolder = await response.json();
          dispatch({ type: "ADD_EXAM_FOLDER", payload: newFolder });

          return {
            success: true,
            message: "Timetable stored successfully in new folder!",
          };
        } else {
          throw new Error(
            `Failed to create folder with timetable: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Failed to save timetable to backend:", error);
        // Fallback to localStorage only - create unique folder name
        const baseFolder = timetableData.tableName;
        const existingFolders = appState.examFolders || [];
        let folderName = baseFolder;
        let counter = 1;

        // Generate unique folder name
        while (existingFolders.some((f) => f && f.folderName === folderName)) {
          folderName = `${baseFolder} (${counter})`;
          counter++;
        }

        const folder = {
          id: Date.now().toString(),
          userId: appState.currentUserId,
          folderName: folderName,
          description: `Exam folder for ${timetableData.tableName}`,
          timetables: [timetableData],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "ADD_EXAM_FOLDER", payload: folder });
        const storedFolders = JSON.parse(
          localStorage.getItem("examFolders") || "[]"
        );
        storedFolders.push(folder);
        localStorage.setItem("examFolders", JSON.stringify(storedFolders));
        return {
          success: false,
          message: `Failed to save to database: ${error.message}. Saved locally instead.`,
        };
      }
    } else {
      // No auth, save to localStorage only - create unique folder name
      const baseFolder = timetableData.tableName;
      const existingFolders = appState.examFolders || [];
      let folderName = baseFolder;
      let counter = 1;

      // Generate unique folder name
      while (existingFolders.some((f) => f && f.folderName === folderName)) {
        folderName = `${baseFolder} (${counter})`;
        counter++;
      }

      const folder = {
        id: Date.now().toString(),
        userId: appState.currentUserId,
        folderName: folderName,
        description: `Exam folder for ${timetableData.tableName}`,
        timetables: [timetableData],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_EXAM_FOLDER", payload: folder });
      const storedFolders = JSON.parse(
        localStorage.getItem("examFolders") || "[]"
      );
      storedFolders.push(folder);
      localStorage.setItem("examFolders", JSON.stringify(storedFolders));
      return {
        success: false,
        message: "Not authenticated. Saved locally only.",
      };
    }
  };

  const handleUpdateTimetable = async (updatedTimetableData) => {
    const auth = localStorage.getItem("auth");

    // Find the folder containing this timetable
    const folder = appState.examFolders.find((f) =>
      f.timetables.some((t) => t.id === updatedTimetableData.id)
    );

    if (auth && folder && updatedTimetableData.id) {
      try {
        const response = await fetch(
          `http://localhost:8084/api/exam-folders/${folder.id}/timetables/${updatedTimetableData.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(updatedTimetableData),
          }
        );

        if (response.ok) {
          const updatedFolder = await response.json();
          dispatch({ type: "UPDATE_EXAM_FOLDER", payload: updatedFolder });
          // Also update localStorage as backup
          const storedFolders = JSON.parse(
            localStorage.getItem("examFolders") || "[]"
          );
          const folderIndex = storedFolders.findIndex(
            (f) => f.id === folder.id
          );
          if (folderIndex !== -1) {
            storedFolders[folderIndex] = updatedFolder;
            localStorage.setItem("examFolders", JSON.stringify(storedFolders));
          }
        } else {
          console.error("Failed to update timetable in backend");
          // Fallback to localStorage only
          const updatedFolder = { ...folder };
          const timetableIndex = updatedFolder.timetables.findIndex(
            (t) => t.id === updatedTimetableData.id
          );
          if (timetableIndex !== -1) {
            updatedFolder.timetables[timetableIndex] = updatedTimetableData;
            updatedFolder.updatedAt = new Date().toISOString();
            dispatch({ type: "UPDATE_EXAM_FOLDER", payload: updatedFolder });

            const storedFolders = JSON.parse(
              localStorage.getItem("examFolders") || "[]"
            );
            const folderIndex = storedFolders.findIndex(
              (f) => f.id === folder.id
            );
            if (folderIndex !== -1) {
              storedFolders[folderIndex] = updatedFolder;
              localStorage.setItem(
                "examFolders",
                JSON.stringify(storedFolders)
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to update timetable in backend:", error);
        // Fallback to localStorage only
        const updatedFolder = { ...folder };
        const timetableIndex = updatedFolder.timetables.findIndex(
          (t) => t.id === updatedTimetableData.id
        );
        if (timetableIndex !== -1) {
          updatedFolder.timetables[timetableIndex] = updatedTimetableData;
          updatedFolder.updatedAt = new Date().toISOString();
          dispatch({ type: "UPDATE_EXAM_FOLDER", payload: updatedFolder });

          const storedFolders = JSON.parse(
            localStorage.getItem("examFolders") || "[]"
          );
          const folderIndex = storedFolders.findIndex(
            (f) => f.id === folder.id
          );
          if (folderIndex !== -1) {
            storedFolders[folderIndex] = updatedFolder;
            localStorage.setItem("examFolders", JSON.stringify(storedFolders));
          }
        }
      }
    }
    dispatch({ type: "SET_EDITING_TIMETABLE", payload: null });
    dispatch({ type: "SET_PAGE", payload: "upcoming-exams" });
  };

  const handleEditTimetable = (timetable) => {
    dispatch({ type: "SET_EDITING_TIMETABLE", payload: timetable });
    dispatch({ type: "SET_PAGE", payload: "create-exam" });
  };

  const handleDeleteTimetable = async (timetableId) => {
    if (window.confirm("Are you sure you want to delete this timetable?")) {
      // Find the folder containing this timetable
      const folder = appState.examFolders.find((f) =>
        f.timetables.some((t) => t.id === timetableId)
      );

      if (!folder) {
        console.error("Folder containing timetable not found");
        return;
      }

      const auth = localStorage.getItem("auth");
      if (auth) {
        try {
          const response = await fetch(
            `http://localhost:8084/api/exam-folders/${folder.id}/timetables/${timetableId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Basic ${auth}`,
              },
            }
          );

          if (response.ok) {
            const updatedFolder = await response.json();

            // If folder has no more timetables, delete the folder
            if (updatedFolder.timetables.length === 0) {
              await fetch(
                `http://localhost:8084/api/exam-folders/${folder.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Basic ${auth}`,
                  },
                }
              );
              dispatch({ type: "DELETE_EXAM_FOLDER", payload: folder.id });
            } else {
              dispatch({ type: "UPDATE_EXAM_FOLDER", payload: updatedFolder });
            }

            // Also update localStorage
            const storedFolders = JSON.parse(
              localStorage.getItem("examFolders") || "[]"
            );
            if (updatedFolder.timetables.length === 0) {
              const updatedStoredFolders = storedFolders.filter(
                (f) => f.id !== folder.id
              );
              localStorage.setItem(
                "examFolders",
                JSON.stringify(updatedStoredFolders)
              );
            } else {
              const folderIndex = storedFolders.findIndex(
                (f) => f.id === folder.id
              );
              if (folderIndex !== -1) {
                storedFolders[folderIndex] = updatedFolder;
                localStorage.setItem(
                  "examFolders",
                  JSON.stringify(storedFolders)
                );
              }
            }
          } else {
            console.error("Failed to delete timetable from backend");
            // Fallback to localStorage only
            handleDeleteTimetableLocal(folder, timetableId);
          }
        } catch (error) {
          console.error("Failed to delete timetable from backend:", error);
          // Fallback to localStorage only
          handleDeleteTimetableLocal(folder, timetableId);
        }
      } else {
        // No auth, remove from localStorage only
        handleDeleteTimetableLocal(folder, timetableId);
      }
    }
  };

  const handleDeleteTimetableLocal = (folder, timetableId) => {
    const updatedFolder = { ...folder };
    updatedFolder.timetables = updatedFolder.timetables.filter(
      (t) => t.id !== timetableId
    );
    updatedFolder.updatedAt = new Date().toISOString();

    if (updatedFolder.timetables.length === 0) {
      dispatch({ type: "DELETE_EXAM_FOLDER", payload: folder.id });
      const storedFolders = JSON.parse(
        localStorage.getItem("examFolders") || "[]"
      );
      const updatedStoredFolders = storedFolders.filter(
        (f) => f.id !== folder.id
      );
      localStorage.setItem("examFolders", JSON.stringify(updatedStoredFolders));
    } else {
      dispatch({ type: "UPDATE_EXAM_FOLDER", payload: updatedFolder });
      const storedFolders = JSON.parse(
        localStorage.getItem("examFolders") || "[]"
      );
      const folderIndex = storedFolders.findIndex((f) => f.id === folder.id);
      if (folderIndex !== -1) {
        storedFolders[folderIndex] = updatedFolder;
        localStorage.setItem("examFolders", JSON.stringify(storedFolders));
      }
    }
  };

  return (
    <div className="homepage-container">
      {appState.isLoggedIn ? (
        <Dashboard
          currentPage={appState.currentPage}
          setPage={setPage}
          onLogout={handleLogout}
          onCreateExam={handleCreateExam}
          onCreateTimetable={handleCreateTimetable}
          onUpdateTimetable={handleUpdateTimetable}
          onEditTimetable={handleEditTimetable}
          onDeleteTimetable={handleDeleteTimetable}
          upcomingExams={appState.upcomingExams}
          completedExams={appState.completedExams}
          examFolders={appState.examFolders}
          editingTimetable={appState.editingTimetable}
          dispatch={dispatch}
          refreshExamFolders={refreshExamFolders}
          onClearAll={handleClearAllTimetables}
        />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState("admin"); // Pre-filled for testing
  const [password, setPassword] = useState("password123"); // Pre-filled for testing

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Hardcoded credentials for temporary testing
    const validUsername = "admin";
    const validPassword = "admin123";

    // Check hardcoded credentials first
    if (username === validUsername && password === validPassword) {
      const auth = btoa(`${username}:${password}`);
      localStorage.setItem("auth", auth);
      onLogin();
      return;
    }

    // If hardcoded credentials fail, show error
    alert(
      "Invalid credentials. Please use username: admin, password: admin123"
    );
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Staff Login</h1>
        <p className="login-subtitle">Access your exam scheduling dashboard.</p>

        {/* Temporary login credentials display */}
        <div
          style={{
            background: "#374151",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            border: "1px solid #4b5563",
          }}
        >
          <h3
            style={{
              color: "#fbbf24",
              margin: "0 0 0.5rem 0",
              fontSize: "0.9rem",
            }}
          >
            🔑 Test Credentials
          </h3>
          <p
            style={{
              color: "#d1d5db",
              margin: "0.25rem 0",
              fontSize: "0.8rem",
            }}
          >
            <strong>Username:</strong> admin
          </p>
          <p
            style={{
              color: "#d1d5db",
              margin: "0.25rem 0",
              fontSize: "0.8rem",
            }}
          >
            <strong>Password:</strong> password123
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="login-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-form-group">
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({
  currentPage,
  setPage,
  onLogout,
  onCreateExam,
  onCreateTimetable,
  onUpdateTimetable,
  onEditTimetable,
  onDeleteTimetable,
  upcomingExams,
  completedExams,
  examFolders,
  editingTimetable,
  dispatch,
  refreshExamFolders,
  onClearAll,
}) => {
  // Removed the useEffect that fetches from backend to avoid CORS errors
  // useEffect(() => {
  //   const fetchExams = async () => {
  //     // Backend API calls removed due to CORS issues
  //   };
  //   fetchExams();
  // }, [dispatch]);

  const renderPage = () => {
    switch (currentPage) {
      case "create-exam":
        return (
          <CreateExamForm
            onCreateExam={onCreateTimetable}
            editingTimetable={editingTimetable}
            onUpdateTimetable={onUpdateTimetable}
            dispatch={dispatch}
          />
        );
      case "upcoming-exams":
        return (
          <TimetableFolders
            title="Exam Timetables"
            timetables={examFolders}
            onEdit={onEditTimetable}
            onDelete={onDeleteTimetable}
            onRefresh={refreshExamFolders}
            onClearAll={onClearAll}
          />
        );
      case "completed-exams":
        return <ExamList title="Completed Exams" exams={completedExams} />;
      default:
        return (
          <div className="dashboard-main">
            <h2 className="dashboard-main-title">Dashboard</h2>
            <p className="dashboard-main-subtitle">
              Welcome, Staff! Select an option from the menu.
            </p>
            <div className="dashboard-grid">
              <DashboardCard
                title="Create Exam"
                description="Generate a new exam timetable."
                onClick={() => setPage("create-exam")}
                icon="M12 4v16m8-8H4"
              />
              <DashboardCard
                title="Exam Timetables"
                description="View and manage your exam timetables."
                onClick={() => setPage("upcoming-exams")}
                icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
              <DashboardCard
                title="Completed Exams"
                description="Review past exam schedules."
                onClick={() => setPage("completed-exams")}
                icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 018.382 17.04c.162.247.294.499.412.753a1.94 1.94 0 00-2.883-2.025 8.953 8.953 0 00-1.282-1.076M9 12l2 2 4-4"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Exam Dashboard</h1>
        <div className="dashboard-nav">
          <button
            onClick={() => setPage("dashboard")}
            className="nav-button nav-button-primary"
          >
            Home
          </button>
          <button
            onClick={() => setPage("create-exam")}
            className="nav-button nav-button-primary"
          >
            Create Exam
          </button>
          <button
            onClick={() => setPage("upcoming-exams")}
            className="nav-button nav-button-primary"
          >
            Exam Timetables
          </button>
          <button
            onClick={() => setPage("completed-exams")}
            className="nav-button nav-button-primary"
          >
            Completed Exams
          </button>
          <button onClick={onLogout} className="nav-button nav-button-danger">
            Logout
          </button>
        </div>
      </header>
      {renderPage()}
    </div>
  );
};

const DashboardCard = ({ title, description, onClick, icon }) => (
  <div onClick={onClick} className="dashboard-card">
    <div className="dashboard-card-icon">
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={icon}
        />
      </svg>
    </div>
    <h3 className="dashboard-card-title">{title}</h3>
    <p className="dashboard-card-description">{description}</p>
  </div>
);

const TimetableFolders = ({
  title,
  timetables,
  onEdit,
  onDelete,
  onRefresh,
  onClearAll,
}) => (
  <div className="timetable-folders">
    <div className="timetable-folders-header">
      <h2 className="timetable-folders-title">{title}</h2>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="refresh-button"
          title="Refresh from database"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      )}
      {onClearAll && timetables.length > 0 && (
        <button
          onClick={onClearAll}
          className="refresh-button"
          style={{ background: "#991b1b", borderColor: "#7f1d1d" }}
          title="Clear all timetables (local only)"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Clear All
        </button>
      )}
    </div>
    <div className="timetable-folders-container">
      {timetables.length > 0 ? (
        <div className="timetable-folders-grid">
          {timetables.map((timetable) => (
            <TimetableFolder
              key={timetable.id}
              timetable={timetable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <p className="timetable-folders-empty">
          No timetables created yet. Create your first exam timetable!
        </p>
      )}
    </div>
  </div>
);

const TimetableFolder = ({ timetable: folder, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimetableCount = () => {
    return folder && folder.timetables ? folder.timetables.length : 0;
  };

  const getExamCount = () => {
    let count = 0;
    if (folder && folder.timetables) {
      folder.timetables.forEach((timetable) => {
        if (timetable && timetable.timetable) {
          timetable.timetable.forEach((day) => {
            if (day.morning) count++;
            if (day.afternoon) count++;
          });
        }
      });
    }
    return count;
  };

  // Early return if folder is not properly defined
  if (!folder || !folder.folderName) {
    return null;
  }

  return (
    <div className="timetable-folder">
      <div
        className="timetable-folder-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="timetable-folder-icon">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2z"
            />
          </svg>
        </div>
        <div className="timetable-folder-info">
          <h3 className="timetable-folder-name">{folder.folderName}</h3>
          <p className="timetable-folder-meta">
            {getTimetableCount()} timetable(s) • {getExamCount()} exams •
            Created:{" "}
            {folder.createdAt ? formatDate(folder.createdAt) : "Unknown"}
          </p>
        </div>
        <div className="timetable-folder-actions">
          {folder.timetables && folder.timetables.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Edit the first timetable in the folder for now
                onEdit(folder.timetables[0]);
              }}
              className="folder-action-button edit-button"
              title="Edit First Timetable"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (folder.timetables && folder.timetables.length > 0) {
                onDelete(folder.timetables[0].id); // Delete first timetable which will delete folder if empty
              }
            }}
            className="folder-action-button delete-button"
            title="Delete Folder"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
        <div className="timetable-folder-chevron">
          <svg
            className={`h-5 w-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isExpanded && folder.timetables && folder.timetables.length > 0 && (
        <div className="timetable-folder-content">
          {folder.timetables.map((timetable, timetableIndex) => (
            <div
              key={timetable.id}
              className="timetable-preview"
              style={{ marginBottom: "20px" }}
            >
              <h4 style={{ color: "#fbbf24", marginBottom: "10px" }}>
                {timetable.tableName}
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.9em",
                    marginLeft: "10px",
                  }}
                >
                  ({timetable.startDate} to {timetable.endDate})
                </span>
              </h4>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Subject</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.timetable &&
                    timetable.timetable.slice(0, 5).map((day, index) => (
                      <React.Fragment key={`${timetableIndex}-${index}`}>
                        {day.morning && (
                          <tr key={`${timetableIndex}-${index}-morning`}>
                            <td>{day.date}</td>
                            <td>{day.morning.session}</td>
                            <td>{day.morning.name}</td>
                            <td>{day.morning.duration} mins</td>
                          </tr>
                        )}
                        {day.afternoon && (
                          <tr key={`${timetableIndex}-${index}-afternoon`}>
                            <td>{day.date}</td>
                            <td>{day.afternoon.session}</td>
                            <td>{day.afternoon.name}</td>
                            <td>{day.afternoon.duration} mins</td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
              {timetable.timetable && timetable.timetable.length > 5 && (
                <p className="preview-more">
                  ... and {timetable.timetable.length - 5} more exam days
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ExamList = ({ title, exams }) => (
  <div className="exam-list">
    <h2 className="exam-list-title">{title}</h2>
    <div className="exam-list-container">
      {exams.length > 0 ? (
        <ul className="exam-list-items">
          {exams.map((exam) => (
            <li key={exam.id} className="exam-item">
              <div className="exam-item-info">
                <h3>{exam.title}</h3>
                <p>
                  Duration: {exam.duration} minutes | Credit Points:{" "}
                  {exam.creditPoints}
                </p>
              </div>
              <span className="exam-item-date">Scheduled on: {exam.date}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="exam-list-empty">No exams to display.</p>
      )}
    </div>
  </div>
);

const CreateExamForm = ({
  onCreateExam,
  editingTimetable = null,
  onUpdateTimetable,
  dispatch,
}) => {
  const [numSubjects, setNumSubjects] = useState(1);
  const [subjects, setSubjects] = useState([
    { id: 1, name: "", duration: "180", credits: "" },
  ]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayGap, setDayGap] = useState(2); // Default max 2 days gap between exams
  const [tableName, setTableName] = useState("");
  const [generatedTimetable, timetableDispatch] = useReducer(
    timetableReducer,
    []
  );
  const timetableRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize form with editing data if in edit mode
  useEffect(() => {
    if (editingTimetable) {
      setIsEditMode(true);
      setTableName(editingTimetable.tableName || "");
      setStartDate(editingTimetable.startDate || "");
      setEndDate(editingTimetable.endDate || "");
      setDayGap(editingTimetable.dayGap || 2);

      // Extract subjects from timetable
      const extractedSubjects = [];
      editingTimetable.timetable.forEach((day) => {
        if (
          day.morning &&
          !extractedSubjects.find((s) => s.name === day.morning.name)
        ) {
          extractedSubjects.push({
            id: extractedSubjects.length + 1,
            name: day.morning.name,
            duration: day.morning.duration || "180",
            credits: day.morning.credits || "",
          });
        }
        if (
          day.afternoon &&
          !extractedSubjects.find((s) => s.name === day.afternoon.name)
        ) {
          extractedSubjects.push({
            id: extractedSubjects.length + 1,
            name: day.afternoon.name,
            duration: day.afternoon.duration || "180",
            credits: day.afternoon.credits || "",
          });
        }
      });

      setSubjects(extractedSubjects);
      setNumSubjects(extractedSubjects.length);
      timetableDispatch({
        type: "SET_TIMETABLE",
        payload: editingTimetable.timetable,
      });
    }
  }, [editingTimetable]);

  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    const list = [...subjects];
    list[index][name] = value;
    setSubjects(list);
  };

  const handleNumSubjectsChange = (e) => {
    const count = parseInt(e.target.value, 10) || 0;
    setNumSubjects(count);
    const newSubjects = Array.from({ length: count }, (_, i) => {
      const existing = subjects[i] || {
        name: "",
        duration: "180",
        credits: "",
      };
      return { ...existing, id: i + 1 };
    });
    setSubjects(newSubjects);
  };

  const generateTimetable = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!tableName.trim()) {
      setErrorMessage("Please enter a table name.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("Please select both a start and end date.");
      return;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (startDateTime > endDateTime) {
      setErrorMessage("The end date must be after the start date.");
      return;
    }

    // Filter valid subjects and sort by credit points (highest first for priority)
    const validSubjects = subjects
      .filter((s) => s.name.trim() !== "")
      .sort((a, b) => parseInt(b.credits || 0) - parseInt(a.credits || 0));

    if (validSubjects.length === 0) {
      setErrorMessage("Please add at least one subject with a name.");
      return;
    }

    const timetableData = [];
    let currentDate = new Date(startDateTime);

    // Helper function to skip weekends
    const skipWeekends = (date) => {
      while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
      }
      return date;
    };

    // Schedule each subject with random day gap
    for (let i = 0; i < validSubjects.length; i++) {
      // Skip weekends
      currentDate = skipWeekends(new Date(currentDate));

      if (currentDate > endDateTime) {
        setErrorMessage(
          `Warning: Could only schedule ${i} out of ${validSubjects.length} subjects within the date range. Consider extending the end date or increasing the max day gap.`
        );
        break;
      }

      const dateStr = currentDate.toLocaleDateString("en-GB");
      const dayName = currentDate.toLocaleDateString("en-US", {
        weekday: "short",
      });

      // Determine session based on preference (alternate or random)
      const useAfternoon = Math.random() > 0.5; // 50% chance for afternoon
      const session = useAfternoon ? "afternoon" : "morning";
      const sessionName = useAfternoon ? "Afternoon" : "Forenoon";
      const timeSlot = useAfternoon
        ? "12:30 PM - 3:30 PM"
        : "9:00 AM - 12:00 PM";

      // Check if this date already exists
      let dayData = timetableData.find((day) => day.date === dateStr);
      if (!dayData) {
        dayData = {
          date: dateStr,
          day: dayName,
          morning: null,
          afternoon: null,
        };
        timetableData.push(dayData);
      }

      // Schedule the exam in the determined session
      if (!dayData[session]) {
        dayData[session] = {
          ...validSubjects[i],
          time: timeSlot,
          session: sessionName,
          code: `${validSubjects[i].name.slice(0, 3).toUpperCase()}${String(
            i + 1
          ).padStart(3, "0")}`,
        };
      } else {
        // If preferred session is taken, use the other session
        const altSession = session === "morning" ? "afternoon" : "morning";
        const altSessionName =
          altSession === "afternoon" ? "Afternoon" : "Forenoon";
        const altTimeSlot =
          altSession === "afternoon"
            ? "12:30 PM - 3:30 PM"
            : "9:00 AM - 12:00 PM";

        if (!dayData[altSession]) {
          dayData[altSession] = {
            ...validSubjects[i],
            time: altTimeSlot,
            session: altSessionName,
            code: `${validSubjects[i].name.slice(0, 3).toUpperCase()}${String(
              i + 1
            ).padStart(3, "0")}`,
          };
        } else {
          // Both sessions taken, move to next available date
          do {
            const gap = Math.floor(Math.random() * dayGap) + 1;
            currentDate.setDate(currentDate.getDate() + gap);
            currentDate = skipWeekends(new Date(currentDate));
          } while (
            currentDate <= endDateTime &&
            timetableData.some(
              (day) =>
                day.date === currentDate.toLocaleDateString("en-GB") &&
                day.morning &&
                day.afternoon
            )
          );

          // Retry scheduling for this subject
          i--;
          continue;
        }
      }

      // Move to next date with random gap
      const gap = Math.floor(Math.random() * dayGap) + 1;
      currentDate.setDate(currentDate.getDate() + gap);
    }

    // Sort timetable by date
    timetableData.sort((a, b) => {
      const dateA = new Date(a.date.split("/").reverse().join("-"));
      const dateB = new Date(b.date.split("/").reverse().join("-"));
      return dateA - dateB;
    });

    timetableDispatch({ type: "SET_TIMETABLE", payload: timetableData });

    // Create timetable object for storage
    const timetableObject = {
      id: isEditMode && editingTimetable ? editingTimetable.id : Date.now(),
      tableName: tableName.trim(),
      startDate,
      endDate,
      dayGap,
      timetable: timetableData,
      createdAt:
        isEditMode && editingTimetable
          ? editingTimetable.createdAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Timetable is generated and displayed
    // Storage happens only when user clicks "Store to Database" button
  };

  const handleCellEdit = (dayIndex, session, field, value) => {
    timetableDispatch({
      type: "UPDATE_CELL",
      payload: { dayIndex, session, field, value },
    });
  };

  const handleCellClick = (dayIndex, session, field) => {
    setEditingCell(`${dayIndex}-${session}-${field}`);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleDownloadImage = () => {
    if (timetableRef.current) {
      html2canvas(timetableRef.current).then((canvas) => {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = "exam_timetable.png";
        link.click();
      });
    }
  };

  const handleDownloadPDF = () => {
    if (timetableRef.current) {
      html2canvas(timetableRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("l", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        const x = 10;
        const y = Math.max(10, (pdfHeight - imgHeight) / 2);
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        pdf.save("exam_timetable.pdf");
      });
    }
  };

  const handleDownloadWord = () => {
    const content = `
      <h1 style="text-align: center; color: #4b5563; margin-bottom: 30px;">Exam Timetable</h1>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #374151; color: #f3f4f6;">
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Date of Exam</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Session</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Day</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Time</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Subject Code</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Subject Name</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Duration</th>
            <th style="padding: 12px; border: 1px solid #4b5563; text-align: center;">Credits</th>
          </tr>
        </thead>
        <tbody>
          ${generatedTimetable
            .map((dayData) => {
              let rows = "";
              if (dayData.morning) {
                rows += `
                <tr style="background-color: #1f2937; color: #d1d5db;">
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.date
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.morning.session
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.day
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.morning.time
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.morning.code || ""
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: left;">${
                    dayData.morning.name || ""
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.morning.duration || "180"
                  } mins</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.morning.credits || ""
                  }</td>
                </tr>
              `;
              }
              if (dayData.afternoon) {
                rows += `
                <tr style="background-color: #374151; color: #d1d5db;">
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.date
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.afternoon.session
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.day
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.afternoon.time
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.afternoon.code || ""
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: left;">${
                    dayData.afternoon.name || ""
                  }</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.afternoon.duration || "180"
                  } mins</td>
                  <td style="padding: 12px; border: 1px solid #4b5563; text-align: center;">${
                    dayData.afternoon.credits || ""
                  }</td>
                </tr>
              `;
              }
              return rows;
            })
            .join("")}
        </tbody>
      </table>
    `;
    const header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Exam Timetable</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;

    const file = new Blob([sourceHTML], { type: "application/msword" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "exam_timetable.doc";
    link.click();
  };

  const handleStoreToDatabase = async () => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      alert("Please login to store data to database.");
      return;
    }

    if (!generatedTimetable || generatedTimetable.length === 0) {
      alert("No timetable generated yet. Please generate a timetable first.");
      return;
    }

    // Create timetable object for database storage
    const timetableObject = {
      id: isEditMode && editingTimetable ? editingTimetable.id : undefined,
      tableName: tableName.trim(),
      startDate,
      endDate,
      dayGap,
      timetable: generatedTimetable,
      createdAt:
        isEditMode && editingTimetable
          ? editingTimetable.createdAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditMode && editingTimetable) {
        // Update existing timetable
        await onUpdateTimetable(timetableObject);
        alert("Timetable updated successfully!");
        return;
      } else {
        // Create new timetable - call the onCreateExam function and wait for result
        const result = await onCreateExam(timetableObject);

        if (result && result.success) {
          alert(result.message);
          // Reset form on success
          timetableDispatch({ type: "SET_TIMETABLE", payload: [] });
          setTableName("");
          setStartDate("");
          setEndDate("");
          setSubjects([{ id: 1, name: "", duration: "180", credits: "" }]);
          setNumSubjects(1);
        } else {
          alert(
            result ? result.message : "Failed to store timetable to database"
          );
        }
        return;
      }
    } catch (error) {
      console.error("Error storing timetable to database:", error);
      alert(`Failed to store timetable to database: ${error.message}`);
    }
  };

  return (
    <div className="create-exam">
      <h2 className="create-exam-title">Create New Exam</h2>
      <div className="create-exam-container">
        <form onSubmit={generateTimetable}>
          <div className="form-grid">
            <div>
              <label className="form-label" htmlFor="tableName">
                Table Name (Folder Name)
              </label>
              <input
                id="tableName"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="form-input"
                placeholder="Enter a name for this timetable"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="startDate">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="endDate">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="dayGap">
                Max Days Gap Between Exams
              </label>
              <input
                id="dayGap"
                type="number"
                min="1"
                max="10"
                value={dayGap}
                onChange={(e) => setDayGap(parseInt(e.target.value))}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="numSubjects">
              Number of Subjects
            </label>
            <input
              id="numSubjects"
              type="number"
              min="1"
              value={numSubjects}
              onChange={handleNumSubjectsChange}
              className="form-input"
            />
          </div>
          {subjects.map((subject, index) => (
            <div key={subject.id} className="subject-grid">
              <h3 className="subject-title">Subject {index + 1}</h3>
              <div className="subject-input-group">
                <label className="subject-input-label">Subject Name</label>
                <input
                  type="text"
                  name="name"
                  value={subject.name}
                  onChange={(e) => handleInputChange(index, e)}
                  className="subject-input"
                  required
                />
              </div>
              <div className="subject-input-group">
                <label className="subject-input-label">
                  Exam Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={subject.duration}
                  placeholder="180"
                  onChange={(e) => handleInputChange(index, e)}
                  className="subject-input"
                  required
                />
              </div>
              <div className="subject-input-group">
                <label className="subject-input-label">Credit Points</label>
                <input
                  type="number"
                  name="credits"
                  value={subject.credits}
                  onChange={(e) => handleInputChange(index, e)}
                  className="subject-input"
                  required
                />
              </div>
            </div>
          ))}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="scheduling-info">
            <h4>📋 Scheduling Rules:</h4>
            <ul>
              <li>
                <strong>Priority:</strong> Subjects are scheduled by highest
                credit points first
              </li>
              <li>
                <strong>Random Gaps:</strong> 1 to {dayGap} days gap between
                exams (randomly assigned)
              </li>
              <li>
                <strong>Sessions:</strong> Morning (9:00 AM - 12:00 PM) and
                Afternoon (12:30 PM - 3:30 PM)
              </li>
              <li>
                <strong>Weekends:</strong> Automatically skipped
              </li>
            </ul>
          </div>
          <button type="submit" className="generate-button">
            {isEditMode ? "Update Timetable" : "Generate Timetable"}
          </button>
        </form>

        {generatedTimetable.length > 0 && (
          <div className="timetable-section">
            <h3 className="timetable-title">Generated Timetable</h3>
            <p className="timetable-instruction">
              Click on any cell to edit the content.
            </p>
            <div ref={timetableRef} className="timetable-table-container">
              <table className="exam-timetable">
                <thead>
                  <tr>
                    <th className="table-header">Date of Exam</th>
                    <th className="table-header">Session</th>
                    <th className="table-header">Day</th>
                    <th className="table-header">Time</th>
                    <th className="table-header">Subject Code</th>
                    <th className="table-header">Subject Name</th>
                    <th className="table-header">Duration</th>
                    <th className="table-header">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedTimetable.map((dayData, dayIndex) => (
                    <React.Fragment key={`day-${dayIndex}`}>
                      {dayData.morning && (
                        <tr key={`${dayIndex}-morning`} className="table-row">
                          <td className="table-cell date-cell">
                            {dayData.date}
                          </td>
                          <td className="table-cell session-cell">
                            {dayData.morning.session}
                          </td>
                          <td className="table-cell day-cell">{dayData.day}</td>
                          <td className="table-cell time-cell">
                            {dayData.morning.time}
                          </td>
                          <td className="table-cell code-cell">
                            {editingCell === `${dayIndex}-morning-code` ? (
                              <input
                                type="text"
                                value={dayData.morning.code || ""}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "morning",
                                    "code",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(dayIndex, "morning", "code")
                                }
                                className="editable-cell"
                              >
                                {dayData.morning.code || "Click to add"}
                              </span>
                            )}
                          </td>
                          <td className="table-cell name-cell">
                            {editingCell === `${dayIndex}-morning-name` ? (
                              <input
                                type="text"
                                value={dayData.morning.name || ""}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "morning",
                                    "name",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(dayIndex, "morning", "name")
                                }
                                className="editable-cell"
                              >
                                {dayData.morning.name || "Click to add"}
                              </span>
                            )}
                          </td>
                          <td className="table-cell duration-cell">
                            {editingCell === `${dayIndex}-morning-duration` ? (
                              <input
                                type="text"
                                value={dayData.morning.duration || "180"}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "morning",
                                    "duration",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(
                                    dayIndex,
                                    "morning",
                                    "duration"
                                  )
                                }
                                className="editable-cell"
                              >
                                {dayData.morning.duration || "180"} mins
                              </span>
                            )}
                          </td>
                          <td className="table-cell credits-cell">
                            {editingCell === `${dayIndex}-morning-credits` ? (
                              <input
                                type="text"
                                value={dayData.morning.credits || ""}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "morning",
                                    "credits",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(
                                    dayIndex,
                                    "morning",
                                    "credits"
                                  )
                                }
                                className="editable-cell"
                              >
                                {dayData.morning.credits || "Click to add"}
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                      {dayData.afternoon && (
                        <tr key={`${dayIndex}-afternoon`} className="table-row">
                          <td className="table-cell date-cell">
                            {dayData.date}
                          </td>
                          <td className="table-cell session-cell">
                            {dayData.afternoon.session}
                          </td>
                          <td className="table-cell day-cell">{dayData.day}</td>
                          <td className="table-cell time-cell">
                            {dayData.afternoon.time}
                          </td>
                          <td className="table-cell code-cell">
                            {editingCell === `${dayIndex}-afternoon-code` ? (
                              <input
                                type="text"
                                value={dayData.afternoon.code || ""}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "afternoon",
                                    "code",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(dayIndex, "afternoon", "code")
                                }
                                className="editable-cell"
                              >
                                {dayData.afternoon.code || "Click to add"}
                              </span>
                            )}
                          </td>
                          <td className="table-cell name-cell">
                            {editingCell === `${dayIndex}-afternoon-name` ? (
                              <input
                                type="text"
                                value={dayData.afternoon.name || ""}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "afternoon",
                                    "name",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(dayIndex, "afternoon", "name")
                                }
                                className="editable-cell"
                              >
                                {dayData.afternoon.name || "Click to add"}
                              </span>
                            )}
                          </td>
                          <td className="table-cell duration-cell">
                            {editingCell ===
                            `${dayIndex}-afternoon-duration` ? (
                              <input
                                type="text"
                                value={dayData.afternoon.duration || "180"}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "afternoon",
                                    "duration",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(
                                    dayIndex,
                                    "afternoon",
                                    "duration"
                                  )
                                }
                                className="editable-cell"
                              >
                                {dayData.afternoon.duration || "180"} mins
                              </span>
                            )}
                          </td>
                          <td className="table-cell credits-cell">
                            {editingCell === `${dayIndex}-afternoon-credits` ? (
                              <input
                                type="text"
                                value={dayData.afternoon.credits || ""}
                                onChange={(e) =>
                                  handleCellEdit(
                                    dayIndex,
                                    "afternoon",
                                    "credits",
                                    e.target.value
                                  )
                                }
                                onBlur={handleCellBlur}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleCellBlur()
                                }
                                className="cell-input"
                                autoFocus
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  handleCellClick(
                                    dayIndex,
                                    "afternoon",
                                    "credits"
                                  )
                                }
                                className="editable-cell"
                              >
                                {dayData.afternoon.credits || "Click to add"}
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="download-section">
              <button
                onClick={handleStoreToDatabase}
                className="download-button download-button-store"
              >
                Store to Database
              </button>
              <button
                onClick={handleDownloadWord}
                className="download-button download-button-word"
              >
                Download Word
              </button>
              <button
                onClick={handleDownloadImage}
                className="download-button download-button-image"
              >
                Download Image
              </button>
              <button
                onClick={handleDownloadPDF}
                className="download-button download-button-pdf"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
