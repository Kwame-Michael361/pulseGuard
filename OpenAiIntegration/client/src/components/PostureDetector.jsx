import { useEffect, useRef, useState, useCallback } from "react";
import { Pose } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";

// ─── Posture scoring algorithm ────────────────────────────────────────────────

function calculateAngle(a, b, c) {
  // Angle at point b between vectors ba and bc
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function calculatePostureScore(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;

  // MediaPipe landmark indices
  const LEFT_SHOULDER = landmarks[11];
  const RIGHT_SHOULDER = landmarks[12];
  const LEFT_EAR = landmarks[7];
  const RIGHT_EAR = landmarks[8];
  const LEFT_HIP = landmarks[23];
  const RIGHT_HIP = landmarks[24];
  const NOSE = landmarks[0];

  let score = 100;
  const issues = [];

  // ── 1. Shoulder levelness (are shoulders even?) ──────────────────────────
  const shoulderDiff = Math.abs(LEFT_SHOULDER.y - RIGHT_SHOULDER.y);
  if (shoulderDiff > 0.05) {
    const penalty = Math.min(shoulderDiff * 200, 25);
    score -= penalty;
    issues.push("Uneven shoulders");
  }

  // ── 2. Head forward posture (ear over shoulder alignment) ────────────────
  const leftEarShoulderOffset = Math.abs(LEFT_EAR.x - LEFT_SHOULDER.x);
  const rightEarShoulderOffset = Math.abs(RIGHT_EAR.x - RIGHT_SHOULDER.x);
  const avgEarOffset = (leftEarShoulderOffset + rightEarShoulderOffset) / 2;
  if (avgEarOffset > 0.08) {
    const penalty = Math.min(avgEarOffset * 150, 25);
    score -= penalty;
    issues.push("Head forward posture");
  }

  // ── 3. Spine alignment (shoulder midpoint over hip midpoint) ─────────────
  const shoulderMidX = (LEFT_SHOULDER.x + RIGHT_SHOULDER.x) / 2;
  const hipMidX = (LEFT_HIP.x + RIGHT_HIP.x) / 2;
  const spineOffset = Math.abs(shoulderMidX - hipMidX);
  if (spineOffset > 0.06) {
    const penalty = Math.min(spineOffset * 150, 25);
    score -= penalty;
    issues.push("Spine misalignment");
  }

  // ── 4. Neck angle (nose over shoulder midpoint) ───────────────────────────
  const noseShoulderOffset = Math.abs(NOSE.x - shoulderMidX);
  if (noseShoulderOffset > 0.1) {
    const penalty = Math.min(noseShoulderOffset * 100, 25);
    score -= penalty;
    issues.push("Neck tilt detected");
  }

  return {
    score: Math.max(0, Math.round(score)),
    issues,
    status: score >= 75 ? "Good" : score >= 50 ? "Fair" : "Poor",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const BACKEND_URL = "http://localhost:5000";
const SEND_INTERVAL_MS = 5000; // send to backend every 5 seconds

export default function PostureDetector({ onScoreUpdate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const lastSentRef = useRef(0);
  const animIdRef = useRef(null);
  const streamRef = useRef(null);

  const [postureData, setPostureData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [dims, setDims] = useState({ w: 640, h: 480 });
  const [mockMode, setMockMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);

  // ── Send posture data to backend ──────────────────────────────────────────
  const sendToBackend = useCallback(async (data) => {
    const now = Date.now();
    if (now - lastSentRef.current < SEND_INTERVAL_MS) return;
    lastSentRef.current = now;

    try {
      const res = await fetch(`${BACKEND_URL}/api/posture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postureScore: data.score,
          postureStatus: data.status,
          timestamp: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      setBackendStatus(json.success ? "synced" : "error");
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  // ── MediaPipe results handler ─────────────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // Draw skeleton overlay
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00ff88",
        lineWidth: 2,
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#ff0055",
        lineWidth: 1,
        radius: 4,
      });

      // Calculate posture
      const data = calculatePostureScore(results.poseLandmarks);
      if (data) {
        setPostureData(data);
        setHistory(prev => [...prev.slice(-9), data.score]);
        sendToBackend(data);
        onScoreUpdate?.(data.score);
      }
    }

    setIsLoading(false);
  }, [sendToBackend]);

  // ── Initialize MediaPipe ──────────────────────────────────────────────────
  useEffect(() => {
  const pose = new Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });

  pose.onResults(onResults);
  poseRef.current = pose;

  let animationId;
  let stream;

  async function startCamera() {
    try {
      // ✅ Directly request the camera — no MediaPipe Camera utility
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user", // front camera on Mac
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;

      // Wait for video to be ready before starting loop
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(resolve);
        };
      });

      setIsLoading(false);

      // ✅ Manual frame loop — more reliable than Camera utility on Mac
      async function frameLoop() {
        if (
          videoRef.current &&
          videoRef.current.readyState === 4 && // HAVE_ENOUGH_DATA
          !videoRef.current.paused
        ) {
          try {
            await poseRef.current.send({ image: videoRef.current });
          } catch (err) {
            // Silently skip frames that fail — don't crash the loop
            console.warn("Frame skipped:", err.message);
          }
        }
        animationId = requestAnimationFrame(frameLoop);
      }

      frameLoop();

    } catch (err) {
      console.error("Camera error:", err.name, err.message);

      if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a webcam and refresh.");
      } else if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Allow access in System Settings → Privacy → Camera.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is in use by another app. Quit Zoom, Teams, or FaceTime and refresh.");
      } else {
        setError(`Camera error: ${err.name} — ${err.message}`);
      }

      setIsLoading(false);
    }
  }

  startCamera();

  // ✅ Proper cleanup — stop stream tracks and cancel animation loop
  return () => {
    cancelAnimationFrame(animationId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    poseRef.current?.close();
  };
}, [onResults]);

  const scoreColor = (s) => !s ? "#555577" : s >= 75 ? "var(--green)" : s >= 50 ? "var(--amber)" : "var(--red)";
  const sc = scoreColor(postureData?.score);
  const score = postureData?.score ?? 0;
  const circ = 2 * Math.PI * 54;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>POSTURE MONITOR</h1>
          <p style={s.subheading}>Real-time skeletal analysis via MediaPipe Pose</p>
        </div>
        <div style={s.syncBadge}>
          <span style={{ ...s.syncDot, background: backendStatus === "synced" ? "var(--green)" : backendStatus === "offline" ? "var(--red)" : "var(--amber)" }} />
          <span style={s.syncText}>{backendStatus === "synced" ? "SYNCED" : backendStatus === "offline" ? "OFFLINE" : "WAITING"}</span>
        </div>
      </div>

      <div style={s.main}>
        {/* Camera */}
        <div style={s.cameraCol}>
          <div style={s.cameraBox}>
            <video ref={videoRef} style={{ display: "none" }} playsInline muted />
            <canvas ref={canvasRef} width={dims.w} height={dims.h} style={s.canvas} />

            {isLoading && !mockMode && (
              <div style={s.overlay}>
                <div style={s.spinner} />
                <p style={s.overlayText}>INITIALIZING CAMERA</p>
              </div>
            )}

            {error && (
              <div style={s.overlay}>
                <span style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠</span>
                <p style={s.errorText}>{error}</p>
                <button onClick={() => { setError(null); setMockMode(true); }} style={s.demoBtn}>
                  RUN DEMO MODE
                </button>
              </div>
            )}

            {mockMode && (
              <div style={s.mockBadge}>DEMO MODE</div>
            )}

            {/* Live score overlay */}
            {postureData && (
              <div style={{ ...s.scorePill, background: sc + "22", border: `1px solid ${sc}`, color: sc }}>
                {postureData.status.toUpperCase()} · {score}
              </div>
            )}
          </div>

          {/* Issues */}
          <div style={s.issuesBox}>
            <div style={s.issuesTitle}>DETECTED ISSUES</div>
            {!postureData ? (
              <span style={s.dimText}>Awaiting detection...</span>
            ) : postureData.issues.length === 0 ? (
              <span style={{ color: "var(--green)", fontSize: "0.82rem", fontFamily: "var(--font-data)" }}>✓ No issues detected</span>
            ) : (
              <div style={s.issuesList}>
                {postureData.issues.map((iss, i) => (
                  <div key={i} style={s.issueItem}>
                    <span style={s.issueDot} />
                    {iss}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stop/Resume Camera Button */}
          {!error && (
            <button
              onClick={() => {
                const newState = !isCameraActive;
                setIsCameraActive(newState);
                if (streamRef.current) {
                  // Stop all tracks in the stream when pausing
                  streamRef.current.getTracks().forEach(track => {
                    track.enabled = newState;
                  });
                }
                if (videoRef.current) {
                  newState ? videoRef.current.play() : videoRef.current.pause();
                }
              }}
              style={{
                ...s.controlBtn,
                background: isCameraActive ? "var(--red-dim)" : "var(--green-dim)",
                borderColor: isCameraActive ? "var(--red)" : "var(--green)",
                color: isCameraActive ? "var(--red)" : "var(--green)",
              }}
            >
              {isCameraActive ? "⏸ PAUSE CAMERA" : "▶ RESUME CAMERA"}
            </button>
          )}
        </div>

        {/* Right panel */}
        <div style={s.panel}>
          {/* Score ring */}
          <div style={s.scoreCard}>
            <div style={s.panelLabel}>POSTURE SCORE</div>
            <div style={s.scoreRing}>
              <svg width={180} height={180} style={{ position: "absolute", top: 0, left: 0 }}>
                <circle cx={90} cy={90} r={54} fill="none" stroke="var(--bg3)" strokeWidth={10} />
                <circle cx={90} cy={90} r={54} fill="none" stroke={sc} strokeWidth={10}
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - score / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                  style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
                />
              </svg>
              <div style={s.scoreInner}>
                <span style={{ ...s.scoreNum, color: sc }}>{score}</span>
                <span style={s.scoreDenom}>/ 100</span>
              </div>
            </div>
            <div style={{ ...s.statusBadge, background: sc + "18", border: `1px solid ${sc}44`, color: sc }}>
              {postureData?.status?.toUpperCase() ?? "DETECTING"}
            </div>
          </div>

          {/* Sparkline history */}
          <div style={s.sparkCard}>
            <div style={s.panelLabel}>SCORE HISTORY</div>
            {history.length > 1 ? (
              <svg width="100%" height={60} viewBox={`0 0 200 60`} preserveAspectRatio="none" style={s.sparkSvg}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sc} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={sc} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#sg)"
                  points={[
                    ...history.map((v, i) => `${(i / (history.length - 1)) * 200},${60 - (v / 100) * 55}`),
                    `${200},${60}`, `0,${60}`
                  ].join(" ")}
                />
                <polyline
                  fill="none" stroke={sc} strokeWidth={2}
                  points={history.map((v, i) => `${(i / (history.length - 1)) * 200},${60 - (v / 100) * 55}`).join(" ")}
                />
              </svg>
            ) : (
              <p style={s.dimText}>Collecting data...</p>
            )}
          </div>

          {/* Stats */}
          <div style={s.statsGrid}>
            {[
              { label: "SESSION AVG", value: history.length ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : "—" },
              { label: "PEAK SCORE",  value: history.length ? Math.max(...history) : "—" },
              { label: "LOW SCORE",   value: history.length ? Math.min(...history) : "—" },
              { label: "SAMPLES",     value: history.length || "—" },
            ].map((stat) => (
              <div key={stat.label} style={s.statBox}>
                <div style={s.statLabel}>{stat.label}</div>
                <div style={s.statVal}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={s.tipsCard}>
            <div style={s.panelLabel}>POSTURE TIPS</div>
            {[
              "Sit with your back against the chair",
              "Screen at eye level",
              "Feet flat on the floor",
              "Shoulders relaxed, not hunched",
            ].map((tip, i) => (
              <div key={i} style={s.tip}>
                <span style={s.tipNum}>{String(i + 1).padStart(2, "0")}</span>
                <span style={s.tipText}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: "32px", height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp 0.4s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  heading: { fontSize: "1.6rem", fontWeight: "800", letterSpacing: "0.15em" },
  subheading: { fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: "4px", fontFamily: "var(--font-data)" },
  syncBadge: { display: "flex", alignItems: "center", gap: "8px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "100px", padding: "6px 14px" },
  syncDot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  syncText: { fontSize: "0.62rem", letterSpacing: "0.15em", fontFamily: "var(--font-data)", color: "var(--text-dim)" },
  main: { display: "flex", gap: "24px", flex: 1, minHeight: 0 },
  cameraCol: { display: "flex", flexDirection: "column", gap: "16px", flex: "0 0 auto" },
  cameraBox: { position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg2)" },
  canvas: { display: "block", width: "520px", height: "390px", objectFit: "cover" },
  overlay: { position: "absolute", inset: 0, background: "rgba(6,6,15,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" },
  spinner: { width: "36px", height: "36px", border: "3px solid var(--border)", borderTop: "3px solid var(--green)", borderRadius: "50%", animation: "spin 1s linear infinite" },
  overlayText: { fontSize: "0.7rem", color: "var(--text-dim)", letterSpacing: "0.2em", fontFamily: "var(--font-data)" },
  errorText: { color: "var(--red)", fontSize: "0.82rem", textAlign: "center", padding: "0 32px", lineHeight: 1.6 },
  demoBtn: { marginTop: "8px", padding: "10px 24px", background: "transparent", border: "1px solid var(--green)", color: "var(--green)", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.15em", fontFamily: "var(--font-data)" },
  controlBtn: { width: "100%", padding: "10px 16px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.15em", fontFamily: "var(--font-data)", fontWeight: "700", transition: "all 0.3s ease" },
  mockBadge: { position: "absolute", top: "12px", left: "12px", background: "var(--amber-dim)", border: "1px solid var(--amber)", color: "var(--amber)", padding: "4px 10px", borderRadius: "4px", fontSize: "0.6rem", letterSpacing: "0.15em", fontFamily: "var(--font-data)" },
  scorePill: { position: "absolute", bottom: "12px", right: "12px", padding: "6px 14px", borderRadius: "100px", fontSize: "0.72rem", letterSpacing: "0.1em", fontFamily: "var(--font-data)", fontWeight: "700" },
  issuesBox: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" },
  issuesTitle: { fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.2em", fontFamily: "var(--font-data)", marginBottom: "10px" },
  dimText: { fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "var(--font-data)" },
  issuesList: { display: "flex", flexDirection: "column", gap: "6px" },
  issueItem: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#ff8866", fontFamily: "var(--font-data)" },
  issueDot: { width: "5px", height: "5px", borderRadius: "50%", background: "var(--red)", flexShrink: 0 },
  panel: { display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflowY: "auto" },
  scoreCard: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  panelLabel: { fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.2em", fontFamily: "var(--font-data)", fontWeight: "700", alignSelf: "flex-start" },
  scoreRing: { position: "relative", width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" },
  scoreInner: { position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" },
  scoreNum: { fontSize: "3rem", fontFamily: "var(--font-data)", lineHeight: 1 },
  scoreDenom: { fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--font-data)" },
  statusBadge: { padding: "6px 20px", borderRadius: "100px", fontSize: "0.72rem", letterSpacing: "0.2em", fontFamily: "var(--font-data)", fontWeight: "700" },
  sparkCard: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px" },
  sparkSvg: { display: "block", marginTop: "10px" },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  statBox: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px" },
  statLabel: { fontSize: "0.55rem", color: "var(--text-dim)", letterSpacing: "0.15em", fontFamily: "var(--font-data)", marginBottom: "4px" },
  statVal: { fontSize: "1.2rem", fontFamily: "var(--font-data)", color: "var(--text)" },
  tipsCard: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" },
  tip: { display: "flex", alignItems: "flex-start", gap: "12px" },
  tipNum: { fontSize: "0.6rem", color: "var(--text-dim)", fontFamily: "var(--font-data)", flexShrink: 0, marginTop: "2px" },
  tipText: { fontSize: "0.78rem", color: "var(--text-dim)", lineHeight: 1.5 },
};