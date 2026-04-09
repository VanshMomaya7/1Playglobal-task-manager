import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            Manager
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <span className="nav-icon">▤</span> Board
        </NavLink>
        <div className="nav-item">
          <span className="nav-icon">◎</span> Updates
        </div>
        <div className="nav-item">
          <span className="nav-icon">⚙</span> Settings
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-widget">
           {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="user-avatar" />
            ) : (
              <div className="user-avatar placeholder">{user?.name?.[0] || 'U'}</div>
            )}
            <div className="user-meta">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">Workspace</span>
            </div>
        </div>
        <button className="btn-logout" onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}
