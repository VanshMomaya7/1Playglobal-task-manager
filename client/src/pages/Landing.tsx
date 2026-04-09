const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function Landing() {
  const handleLogin = () => {
    // Direct browser redirect to NestJS OAuth entry point
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="landing-page">
      <div className="landing-nav">
        <div className="landing-logo">✦ Task Manager</div>
        <button onClick={handleLogin} className="btn btn-outline">Sign In</button>
      </div>

      <main className="landing-hero">
        <div className="hero-badge">Next-Generation Workflow</div>
        <h1 className="hero-title">
          Manage your tasks, <br />
          <span className="hero-highlight">beautifully.</span>
        </h1>
        <p className="hero-subtitle">
          Experience a sleek, Apple-inspired Kanban board that gets out of your way. Fast, offline-first feel, securely synced to the cloud.
        </p>

        <div className="hero-actions">
          <button onClick={handleLogin} className="btn btn-primary btn-large">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.54 12.08C21.54 11.26 21.47 10.46 21.34 9.69H12V14.21H17.35C17.12 15.67 16.29 16.92 15.06 17.75V20.73H18.28C20.17 19.01 21.54 16.5 21.54 12.08Z" fill="currentColor"/><path d="M12 21.75C14.68 21.75 16.94 20.86 18.28 19.14L15.06 16.16C14.34 16.64 13.26 16.96 12 16.96C9.56 16.96 7.48 15.31 6.74 13.06H3.45V16.13C5.03 19.27 8.28 21.75 12 21.75Z" fill="currentColor"/><path d="M6.74 13.04C6.55 12.48 6.44 11.88 6.44 11.25C6.44 10.61 6.55 10.02 6.74 9.45V6.37H3.45C2.8 7.67 2.44 9.13 2.44 10.75C2.44 12.36 2.8 13.82 3.45 15.12L6.74 13.04Z" fill="currentColor"/><path d="M12 5.53C13.46 5.53 14.77 6.03 15.8 7.02L18.35 4.47C16.93 3.15 14.67 2.25 12 2.25C8.28 2.25 5.03 4.73 3.45 7.87L6.74 10.95C7.48 8.7 9.56 5.53 12 5.53Z" fill="currentColor"/></svg>
            Continue with Google
          </button>
        </div>

        <div className="hero-preview">
          <div className="preview-window">
             <div className="preview-header">
               <span className="dot red"></span>
               <span className="dot yellow"></span>
               <span className="dot green"></span>
             </div>
             <div className="preview-body">
                {/* Mock display to show the aesthetic natively */}
                <div className="mock-card">✦ Design System Overhaul</div>
                <div className="mock-card mock-active">Implement OAuth Flows</div>
                <div className="mock-card">Ship to production</div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
