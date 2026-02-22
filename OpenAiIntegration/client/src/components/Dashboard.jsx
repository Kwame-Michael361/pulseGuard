import { useState, useEffect } from "react";

function StatCard({ label, value, unit, color, icon, delay = 0, sub }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      ...st.card,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      borderColor: color + "44",
    }}>
      <div style={st.cardTop}>
        <span style={{ ...st.cardIcon, color }}>{icon}</span>
        <span style={st.cardLabel}>{label}</span>
      </div>
      <div style={st.cardValue}>
        <span style={{ ...st.cardNumber, color }}>{value ?? "—"}</span>
        {unit && <span style={st.cardUnit}>{unit}</span>}
      </div>
      {sub && <div style={st.cardSub}>{sub}</div>}
      <div style={{ ...st.cardGlow, background: color + "10" }} />
    </div>
  );
}

function RingGauge({ value, size = 120, color, sublabel }) {
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (value ?? 0) / 100);
  return (
    <div style={{ ...st.ring, width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="var(--bg3)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={st.ringInner}>
        <span style={{ ...st.ringValue, color }}>{value ?? "—"}</span>
        <span style={st.ringUnit}>/ 100</span>
        {sublabel && <span style={st.ringSublabel}>{sublabel}</span>}
      </div>
    </div>
  );
}

function ActivityBar({ label, value, color }) {
  return (
    <div style={st.bar}>
      <div style={st.barTop}>
        <span style={st.barLabel}>{label}</span>
        <span style={{ ...st.barValue, color }}>{value}%</span>
      </div>
      <div style={st.barTrack}>
        <div style={{ ...st.barFill, width: `${value}%`, background: color, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

export default function Dashboard({ postureScore, healthData }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const bmi = healthData?.bmi ?? null;
  const riskScore = healthData?.healthRiskScore ?? null;
  const hydration = healthData?.hydrationLevel ?? "—";
  const activity = healthData?.activityLevel ?? "—";
  const overallScore = postureScore != null && riskScore != null
    ? Math.round((postureScore + (100 - riskScore)) / 2)
    : postureScore ?? null;

  const scoreColor = (s) => !s ? "var(--text-dim)" : s >= 75 ? "var(--green)" : s >= 50 ? "var(--amber)" : "var(--red)";
  const riskColor  = (s) => !s ? "var(--text-dim)" : s < 40 ? "var(--green)" : s < 70 ? "var(--amber)" : "var(--red)";
  const bmiColor   = (b) => !b ? "var(--text-dim)" : b < 18.5 ? "var(--blue)" : b < 25 ? "var(--green)" : b < 30 ? "var(--amber)" : "var(--red)";
  const bmiLabel   = (b) => !b ? null : b < 18.5 ? "UNDERWEIGHT" : b < 25 ? "NORMAL" : b < 30 ? "OVERWEIGHT" : "OBESE";

  return (
    <div style={st.page}>
      <div style={st.header}>
        <div>
          <h1 style={st.heading}>HEALTH OVERVIEW</h1>
          <p style={st.subheading}>Real-time biometric monitoring dashboard</p>
        </div>
        <div style={st.clock}>
          <div style={st.clockTime}>{time.toLocaleTimeString("en-US", { hour12: false })}</div>
          <div style={st.clockDate}>{time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
        </div>
      </div>

      {/* Gauge row */}
      <div style={st.gaugeRow}>
        <div style={st.gaugeCard}>
          <div style={st.gaugeLabel}>OVERALL SCORE</div>
          <RingGauge value={overallScore} size={160} color={scoreColor(overallScore)}
            sublabel={!overallScore ? "AWAITING DATA" : overallScore >= 75 ? "OPTIMAL" : overallScore >= 50 ? "MODERATE" : "ATTENTION"} />
        </div>
        <div style={st.dividerV} />
        <div style={st.gaugeCard}>
          <div style={st.gaugeLabel}>POSTURE SCORE</div>
          <RingGauge value={postureScore} size={130} color={scoreColor(postureScore)} />
        </div>
        <div style={st.dividerV} />
        <div style={st.gaugeCard}>
          <div style={st.gaugeLabel}>HEALTH RISK</div>
          <RingGauge value={riskScore} size={130} color={riskColor(riskScore)} />
        </div>
        <div style={st.dividerV} />
        <div style={{ flex: 1 }}>
          <div style={st.gaugeLabel}>HEALTH INDICATORS</div>
          <div style={st.bars}>
            <ActivityBar label="POSTURE" value={postureScore ?? 0} color={scoreColor(postureScore)} />
            <ActivityBar label="RISK INDEX (INV.)" value={riskScore ? 100 - riskScore : 0} color={riskColor(riskScore)} />
            <ActivityBar label="HYDRATION"
              value={hydration === "High" ? 90 : hydration === "Moderate" ? 58 : hydration === "Low" ? 22 : 0}
              color="var(--blue)" />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={st.grid}>
        <StatCard label="BODY MASS INDEX" value={bmi?.toFixed(1) ?? "—"} unit="kg/m²"
          color={bmiColor(bmi)} icon="◈" delay={0} sub={bmiLabel(bmi)} />
        <StatCard label="HYDRATION LEVEL" value={hydration}
          color="var(--blue)" icon="◎" delay={80} />
        <StatCard label="ACTIVITY LEVEL" value={activity}
          color="var(--amber)" icon="◉" delay={160} />
        <StatCard label="POSTURE STATUS"
          value={postureScore >= 75 ? "GOOD" : postureScore >= 50 ? "FAIR" : postureScore ? "POOR" : "—"}
          color={scoreColor(postureScore)} icon="⬡" delay={240}
          sub={postureScore ? `Live score: ${postureScore}` : "Start posture monitor"} />
      </div>

      {!healthData && (
        <div style={st.notice}>
          <span style={st.noticeDot} />
          Complete the Health Assessment to populate all biometric metrics
        </div>
      )}
    </div>
  );
}

const st = {
  page: { padding: "32px", height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp 0.4s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  heading: { fontSize: "1.6rem", fontWeight: "800", letterSpacing: "0.15em", color: "var(--text)" },
  subheading: { fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: "4px", fontFamily: "var(--font-data)" },
  clock: { textAlign: "right" },
  clockTime: { fontSize: "1.8rem", fontFamily: "var(--font-data)", color: "var(--green)", letterSpacing: "0.05em" },
  clockDate: { fontSize: "0.65rem", color: "var(--text-dim)", letterSpacing: "0.1em", fontFamily: "var(--font-data)", textTransform: "uppercase" },
  gaugeRow: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px 32px", display: "flex", alignItems: "center", gap: "32px" },
  gaugeCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  gaugeLabel: { fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.2em", fontFamily: "var(--font-data)", fontWeight: "700" },
  dividerV: { width: "1px", height: "120px", background: "var(--border)", flexShrink: 0 },
  ring: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center" },
  ringInner: { position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1px" },
  ringValue: { fontSize: "1.8rem", fontFamily: "var(--font-data)", lineHeight: 1 },
  ringUnit: { fontSize: "0.6rem", color: "var(--text-dim)", fontFamily: "var(--font-data)" },
  ringSublabel: { fontSize: "0.52rem", color: "var(--text-dim)", letterSpacing: "0.1em", fontFamily: "var(--font-data)", marginTop: "2px" },
  bars: { display: "flex", flexDirection: "column", gap: "18px", flex: 1 },
  bar: { display: "flex", flexDirection: "column", gap: "6px" },
  barTop: { display: "flex", justifyContent: "space-between" },
  barLabel: { fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.15em", fontFamily: "var(--font-data)" },
  barValue: { fontSize: "0.6rem", fontFamily: "var(--font-data)", fontWeight: "700" },
  barTrack: { height: "4px", background: "var(--bg3)", borderRadius: "2px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "2px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  card: { background: "var(--bg2)", border: "1px solid", borderRadius: "12px", padding: "20px", position: "relative", overflow: "hidden" },
  cardTop: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
  cardIcon: { fontSize: "14px" },
  cardLabel: { fontSize: "0.58rem", color: "var(--text-dim)", letterSpacing: "0.18em", fontFamily: "var(--font-data)", fontWeight: "700" },
  cardValue: { display: "flex", alignItems: "baseline", gap: "4px" },
  cardNumber: { fontSize: "1.5rem", fontFamily: "var(--font-data)", lineHeight: 1 },
  cardUnit: { fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--font-data)" },
  cardSub: { fontSize: "0.58rem", color: "var(--text-dim)", letterSpacing: "0.12em", fontFamily: "var(--font-data)", marginTop: "6px" },
  cardGlow: { position: "absolute", inset: 0, pointerEvents: "none" },
  notice: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", color: "var(--amber)", letterSpacing: "0.1em", fontFamily: "var(--font-data)", background: "var(--amber-dim)", border: "1px solid rgba(255,204,0,0.2)", borderRadius: "8px", padding: "12px 16px" },
  noticeDot: { width: "6px", height: "6px", borderRadius: "50%", background: "var(--amber)", flexShrink: 0 },
};