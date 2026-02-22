import { useState } from "react";
import "./index.css";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import PostureDetector from "./components/PostureDetector";
import HealthAssessment from "./components/healthAssesment";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [postureScore, setPostureScore] = useState(null);
  const [healthData, setHealthData] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Navigation view={view} setView={setView} />
      <main style={{ flex: 1, overflow: "hidden" }}>
        {view === "dashboard" && (
          <Dashboard postureScore={postureScore} healthData={healthData} />
        )}
        {view === "posture" && (
          <PostureDetector onScoreUpdate={setPostureScore} />
        )}
        {view === "assessment" && (
          <HealthAssessment
            onHealthData={setHealthData}
            postureScore={postureScore}
          />
        )}
      </main>
    </div>
  );
}