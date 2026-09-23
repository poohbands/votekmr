import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import EvaluationView from './components/EvaluationView';
import AdminDashboard from './components/AdminDashboard';
import { pullFromCloud } from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('evaluation');
  const [theme, setTheme] = useState('dark');

  // Auto restore user session and pull Cloud DB data
  useEffect(() => {
    // Initial Cloud Database Pull
    pullFromCloud();

    // Setup Realtime Cloud Sync Polling every 8 seconds
    const interval = setInterval(() => {
      pullFromCloud();
    }, 8000);

    const savedUserJson = localStorage.getItem('masseuse_app_current_user');
    if (savedUserJson) {
      try {
        const u = JSON.parse(savedUserJson);
        setCurrentUser(u);
        if (u.role === 'admin') {
          setActiveTab('dashboard');
        }
      } catch (e) {
        console.error('Failed to parse saved user session:', e);
      }
    }

    const savedTheme = localStorage.getItem('masseuse_app_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('masseuse_app_current_user', JSON.stringify(user));
    if (user.role === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('evaluation');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('masseuse_app_current_user');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('masseuse_app_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // If not logged in, render LoginModal
  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'evaluation' ? (
          <EvaluationView currentUser={currentUser} />
        ) : (
          <AdminDashboard currentUser={currentUser} />
        )}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto'
      }}>
        ระบบประเมินหมอนวด (Masseuse Performance Evaluation System) &copy; 2026
      </footer>
    </div>
  );
}
