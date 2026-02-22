import { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:5000";

const ACTIVITY_OPTIONS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active"];
const HYDRATION_OPTIONS = ["Low", "Moderate", "High"];

function Field({ label, name, type = "number", value, onChange, options, unit, hint }) {
  return (
    <div style={f.field}>
      <label style={f.label}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(name, e.target.value)} style={f.select}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div style={f.inputRow}>
          <input
            type={type}
            value={value}
            onChange={e => onChange(name, e.target.value)}
            style={f.input}
            placeholder="—"
          />
          {unit && <span style={f.unit}>{unit}</span>}
        </div>
      )}
      {hint && <div style={f.hint}>{hint}</div>}
    </div>
  );
}

function ResultSection({ title, content, color = "var(--green)" }) {
  return (
    <div style={{ ...r.section, borderColor: color + "33" }}>
      <div style={{ ...r.sectionTitle, color }}>{title}</div>
      <div style={r.sectionBody}>{content}</div>
    </div>
  );
}

function parseRecommendations(text) {
  if (!text) return null;
  const parts = {};
  const sections = ["Summary", "Recommendations", "Risk Level", "Preventive Actions", "Important Flags"];
  sections.forEach(section => {
    const regex = new RegExp(`${section}:\\s*([\\s\\S]*?)(?=(${sections.join("|")}):|$)`);
    const match = text.match(regex);
    if (match) parts[section] = match[1].trim();
  });
  return parts;
}

export default function HealthAssessment({ onHealthData, postureScore }) {
  const STORAGE_KEY = "pulseGuard_healthAssessmentForm";

  // Initialize form from sessionStorage or with defaults
  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved form data:", e);
      }
    }
    return {
      age: "", weight: "", height: "",
      hydrationLevel: "", activityLevel: "", postureScore: "",
    };
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [rawText, setRawText] = useState(null);

  // Save form to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = (name, value) => setForm(p => ({ ...p, [name]: value }));

  // Clear form and sessionStorage
  const clearForm = () => {
    setForm({
      age: "", weight: "", height: "",
      hydrationLevel: "", activityLevel: "", postureScore: "",
    });
    sessionStorage.removeItem(STORAGE_KEY);
    setResult(null);
    setError(null);
    setRawText(null);
  };

  const bmiPreview = form.weight && form.height
    ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
    : null;

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    const payload = {
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
      postureScore: postureScore ?? Number(form.postureScore) ?? 50,
      activityLevel: form.activityLevel,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error ?? "Request failed");

      setRawText(json.recommendations);
      setResult(parseRecommendations(json.recommendations));
      onHealthData?.(json.healthData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allFilled = form.age && form.weight && form.height && form.activityLevel && (postureScore || form.postureScore);
  const riskLevel = result?.["Risk Level"];
  const riskColor = riskLevel?.includes("High") ? "var(--red)" : riskLevel?.includes("Moderate") ? "var(--amber)" : "var(--green)";

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>HEALTH ASSESSMENT</h1>
          <p style={s.subheading}>Input biometric data to generate AI-powered preventive recommendations</p>
        </div>
        {postureScore != null && (
          <div style={s.postureChip}>
            <span style={s.chipDot} />
            <span style={s.chipText}>Posture: {postureScore} (live)</span>
          </div>
        )}
      </div>

      <div style={s.layout}>
        {/* Form */}
        <div style={s.formCard}>
          <div style={s.formTitle}>BIOMETRIC INPUT</div>

          <div style={s.grid}>
            <Field label="AGE" name="age" value={form.age} onChange={update} unit="yrs" hint="18 — 120" />
            <Field label="WEIGHT" name="weight" value={form.weight} onChange={update} unit="kg" />
            <Field label="HEIGHT" name="height" value={form.height} onChange={update} unit="cm" />
            <div style={f.field}>
              <label style={f.label}>BMI (COMPUTED)</label>
              <div style={f.inputRow}>
                <div style={{ ...f.input, color: bmiPreview ? "var(--green)" : "var(--text-dim)", display: "flex", alignItems: "center" }}>
                  {bmiPreview ?? "—"}
                </div>
                <span style={f.unit}>kg/m²</span>
              </div>
              <div style={f.hint}>Auto-calculated</div>
            </div>
          </div>

          <div style={s.divider} />

          <div style={s.grid}>
            <Field label="HYDRATION LEVEL" name="hydrationLevel" value={form.hydrationLevel} onChange={update} options={HYDRATION_OPTIONS} />
            <Field label="ACTIVITY LEVEL" name="activityLevel" value={form.activityLevel} onChange={update} options={ACTIVITY_OPTIONS} />
            {!postureScore && (
              <Field label="POSTURE SCORE" name="postureScore" value={form.postureScore} onChange={update} unit="/100" hint="Run posture monitor for live value" />
            )}
          </div>

          {postureScore != null && (
            <div style={s.livePosture}>
              <span style={s.liveIcon}>◉</span>
              <span style={s.liveText}>Using live posture score: <strong style={{ color: "var(--green)" }}>{postureScore}</strong></span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allFilled || loading}
            style={{ ...s.btn, opacity: allFilled && !loading ? 1 : 0.4, cursor: allFilled && !loading ? "pointer" : "not-allowed" }}
          >
            {loading ? (
              <span style={s.btnLoading}>
                <span style={s.btnSpinner} />
                ANALYSING...
              </span>
            ) : "GENERATE RECOMMENDATIONS →"}
          </button>

          <button
            onClick={clearForm}
            disabled={loading}
            style={{ ...s.clearBtn, opacity: loading ? 0.4 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            CLEAR FORM
          </button>

          {error && (
            <div style={s.errorBox}>
              <span style={{ color: "var(--red)", marginRight: "8px" }}>⚠</span>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div style={s.resultsCol}>
          {!result && !loading && (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>⬡</div>
              <div style={s.emptyTitle}>AWAITING INPUT</div>
              <div style={s.emptyText}>Fill in your biometric data and submit to generate your personalised health recommendations.</div>
            </div>
          )}

          {loading && (
            <div style={s.emptyState}>
              <div style={{ ...s.btnSpinner, width: "40px", height: "40px", borderWidth: "3px", marginBottom: "16px" }} />
              <div style={s.emptyTitle}>ANALYSING DATA</div>
              <div style={s.emptyText}>Building personalised recommendations...</div>
            </div>
          )}

          {result && (
            <div style={r.results}>
              {/* Risk level badge — top */}
              <div style={{ ...r.riskBanner, background: riskColor + "14", borderColor: riskColor + "44" }}>
                <div style={{ ...r.riskLabel, color: riskColor }}>RISK LEVEL</div>
                <div style={{ ...r.riskValue, color: riskColor }}>{result["Risk Level"] ?? "—"}</div>
              </div>

              {/* Summary */}
              {result["Summary"] && (
                <ResultSection title="SUMMARY" content={
                  <p style={r.prose}>{result["Summary"]}</p>
                } color="var(--blue)" />
              )}

              {/* Recommendations */}
              {result["Recommendations"] && (
                <ResultSection title="RECOMMENDATIONS" content={
                  <div style={r.list}>
                    {result["Recommendations"].split("\n").filter(l => l.trim()).map((line, i) => (
                      <div key={i} style={r.listItem}>
                        <span style={{ ...r.bullet, background: "var(--green)" }} />
                        <span style={r.listText}>{line.replace(/^[-•]\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                } color="var(--green)" />
              )}

              {/* Preventive actions */}
              {result["Preventive Actions"] && (
                <ResultSection title="PREVENTIVE ACTIONS" content={
                  <div style={r.list}>
                    {result["Preventive Actions"].split("\n").filter(l => l.trim()).map((line, i) => (
                      <div key={i} style={r.listItem}>
                        <span style={{ ...r.bullet, background: "var(--amber)" }} />
                        <span style={r.listText}>{line.replace(/^[-•]\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                } color="var(--amber)" />
              )}

              {/* Important flags */}
              {result["Important Flags"] && (
                <ResultSection title="⚠ IMPORTANT FLAGS" content={
                  <div style={r.list}>
                    {result["Important Flags"].split("\n").filter(l => l.trim()).map((line, i) => (
                      <div key={i} style={r.listItem}>
                        <span style={{ ...r.bullet, background: "var(--red)" }} />
                        <span style={r.listText}>{line.replace(/^[-•]\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                } color="var(--red)" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const f = {
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.18em", fontFamily: "var(--font-data)", fontWeight: "700" },
  inputRow: { display: "flex", alignItems: "center", gap: "8px" },
  input: { flex: 1, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 12px", color: "var(--text)", fontSize: "0.9rem", fontFamily: "var(--font-data)", outline: "none", width: "100%" },
  select: { width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 12px", color: "var(--text)", fontSize: "0.85rem", fontFamily: "var(--font-data)", outline: "none", cursor: "pointer" },
  unit: { fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--font-data)", flexShrink: 0 },
  hint: { fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "var(--font-data)", letterSpacing: "0.08em" },
};

const r = {
  results: { display: "flex", flexDirection: "column", gap: "14px" },
  riskBanner: { border: "1px solid", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  riskLabel: { fontSize: "0.6rem", letterSpacing: "0.2em", fontFamily: "var(--font-data)", fontWeight: "700" },
  riskValue: { fontSize: "1.2rem", fontFamily: "var(--font-data)", fontWeight: "700", letterSpacing: "0.05em" },
  section: { background: "var(--bg2)", border: "1px solid", borderRadius: "10px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" },
  sectionTitle: { fontSize: "0.6rem", letterSpacing: "0.2em", fontFamily: "var(--font-data)", fontWeight: "700" },
  sectionBody: {},
  prose: { fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.7, fontFamily: "var(--font-ui)" },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  listItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  bullet: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, marginTop: "6px" },
  listText: { fontSize: "0.82rem", color: "var(--text)", lineHeight: 1.6, fontFamily: "var(--font-ui)" },
  copyBtn: { alignSelf: "flex-start", background: "transparent", border: "1px solid var(--border)", color: "var(--text-dim)", padding: "8px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "0.65rem", letterSpacing: "0.15em", fontFamily: "var(--font-data)" },
};

const s = {
  page: { padding: "32px", height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp 0.4s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  heading: { fontSize: "1.6rem", fontWeight: "800", letterSpacing: "0.15em" },
  subheading: { fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: "4px", fontFamily: "var(--font-data)" },
  postureChip: { display: "flex", alignItems: "center", gap: "8px", background: "var(--green-dim)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: "100px", padding: "6px 16px" },
  chipDot: { width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", animation: "glow-pulse 2s infinite" },
  chipText: { fontSize: "0.65rem", color: "var(--green)", fontFamily: "var(--font-data)", letterSpacing: "0.1em" },
  layout: { display: "flex", gap: "24px", flex: 1 },
  formCard: { width: "380px", flexShrink: 0, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },
  formTitle: { fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.2em", fontFamily: "var(--font-data)", fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  divider: { height: "1px", background: "var(--border)" },
  livePosture: { display: "flex", alignItems: "center", gap: "8px", background: "var(--green-dim)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "8px", padding: "10px 14px" },
  liveIcon: { color: "var(--green)", fontSize: "12px" },
  liveText: { fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "var(--font-data)" },
  btn: { width: "100%", padding: "14px", background: "var(--green)", border: "none", borderRadius: "8px", color: "#06060f", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.15em", fontFamily: "var(--font-data)", transition: "opacity 0.2s" },
  clearBtn: { width: "100%", padding: "10px", background: "transparent", border: "1px solid var(--text-dim)", borderRadius: "8px", color: "var(--text-dim)", fontSize: "0.7rem", fontWeight: "600", letterSpacing: "0.12em", fontFamily: "var(--font-data)", transition: "all 0.2s", cursor: "pointer" },
  btnLoading: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  btnSpinner: { width: "16px", height: "16px", border: "2px solid rgba(6,6,15,0.3)", borderTop: "2px solid #06060f", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
  errorBox: { background: "var(--red-dim)", border: "1px solid rgba(255,68,85,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.75rem", color: "var(--red)", fontFamily: "var(--font-data)" },
  resultsCol: { flex: 1, overflowY: "auto" },
  emptyState: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "var(--text-dim)" },
  emptyIcon: { fontSize: "3rem", color: "var(--border)", marginBottom: "8px" },
  emptyTitle: { fontSize: "0.75rem", letterSpacing: "0.2em", fontFamily: "var(--font-data)", color: "var(--text-dim)" },
  emptyText: { fontSize: "0.8rem", color: "var(--text-dim)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 },
};