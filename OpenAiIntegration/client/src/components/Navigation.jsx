export default function Navigation({ view, setView }) {
  const links = [
    { id: "dashboard",   icon: "◈", label: "DASHBOARD"   },
    { id: "posture",     icon: "◉", label: "POSTURE"      },
    { id: "assessment",  icon: "◎", label: "ASSESSMENT"   },
  ];

  return (
    <nav style={s.nav}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoMark}>
          <span style={s.logoIcon}>⬡</span>
        </div>
        <div>
          <div style={s.logoName}>pulseGuard</div>
          <div style={s.logoSub}>AI · HEALTH</div>
        </div>
      </div>

      {/* Divider */}
      <div style={s.divider} />

      {/* Links */}
      <div style={s.links}>
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => setView(l.id)}
            style={{
              ...s.link,
              ...(view === l.id ? s.linkActive : {}),
            }}
          >
            <span style={{
              ...s.linkIcon,
              color: view === l.id ? "var(--green)" : "var(--text-dim)",
            }}>
              {l.icon}
            </span>
            <span style={{
              ...s.linkLabel,
              color: view === l.id ? "var(--text)" : "var(--text-dim)",
            }}>
              {l.label}
            </span>
            {view === l.id && <div style={s.activeBar} />}
          </button>
        ))}
      </div>

      {/* Bottom status */}
      <div style={s.bottom}>
        <div style={s.divider} />
        <div style={s.statusRow}>
          <span style={s.statusDot} />
          <span style={s.statusText}>SYSTEM ONLINE</span>
        </div>
        <div style={s.version}>v1.0.0 · Team Quantum Pulse</div>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    width: "200px",
    minWidth: "200px",
    height: "100vh",
    background: "var(--bg2)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "28px 0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 20px 0 20px",
    marginBottom: "4px",
  },
  logoMark: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "var(--green-dim)",
    border: "1px solid var(--green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: "18px",
    color: "var(--green)",
  },
  logoName: {
    fontSize: "0.75rem",
    fontWeight: "800",
    letterSpacing: "0.2em",
    color: "var(--text)",
    fontFamily: "var(--font-data)",
  },
  logoSub: {
    fontSize: "0.6rem",
    color: "var(--text-dim)",
    letterSpacing: "0.15em",
    fontFamily: "var(--font-data)",
    marginTop: "2px",
  },
  divider: {
    height: "1px",
    background: "var(--border)",
    margin: "20px 0",
  },
  links: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "0 12px",
    flex: 1,
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.15s",
    textAlign: "left",
    width: "100%",
  },
  linkActive: {
    background: "rgba(0,255,136,0.06)",
  },
  linkIcon: {
    fontSize: "14px",
    flexShrink: 0,
    transition: "color 0.15s",
  },
  linkLabel: {
    fontSize: "0.7rem",
    fontWeight: "700",
    letterSpacing: "0.15em",
    fontFamily: "var(--font-data)",
    transition: "color 0.15s",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: "25%",
    height: "50%",
    width: "3px",
    background: "var(--green)",
    borderRadius: "0 2px 2px 0",
  },
  bottom: {
    padding: "0 20px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--green)",
    animation: "glow-pulse 2s ease-in-out infinite",
  },
  statusText: {
    fontSize: "0.6rem",
    color: "var(--green)",
    letterSpacing: "0.15em",
    fontFamily: "var(--font-data)",
  },
  version: {
    fontSize: "0.55rem",
    color: "var(--text-dim)",
    letterSpacing: "0.1em",
    fontFamily: "var(--font-data)",
  },
};