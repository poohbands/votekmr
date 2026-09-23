import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import EvaluationView from './components/EvaluationView';
import AdminDashboard from './components/AdminDashboard';
import MaintenanceScreen from './components/MaintenanceScreen';
import { pullFromCloud, getSystemSettings, isMaintenanceActive, setMaintenanceMode } from './data/mockData';
import { Wrench, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('evaluation');
  const [theme, setTheme] = useState('dark');
  const [systemSettings, setSystemSettings] = useState(getSystemSettings());

  const refreshSettings = () => {
    setSystemSettings(getSystemSettings());
  };

  // Auto restore user session and pull Cloud DB data
  useEffect(() => {
    // Initial Cloud Database Pull
    pullFromCloud().then(() => {
      refreshSettings();
    });

    // Setup Realtime Cloud Sync Polling every 8 seconds
    const interval = setInterval(() => {
      pullFromCloud().then(() => {
        refreshSettings();
      });
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

  const handleDisableMaintenance = () => {
    const updated = setMaintenanceMode(false);
    setSystemSettings(updated);
  };

  const isMaintenance = Boolean(systemSettings.isMaintenanceMode);
  const isAdmin = currentUser?.role === 'admin';

  // If Maintenance Mode is active and user is NOT Admin, show MaintenanceScreen
  if (isMaintenance && !isAdmin) {
    return (
      <MaintenanceScreen
        currentUser={currentUser}
        maintenanceMessage={systemSettings.maintenanceMessage}
        onAdminLogin={handleLogin}
        onLogout={handleLogout}
      />
    );
  }

  // If not logged in, render LoginModal
  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Maintenance Mode Active Banner */}
      {isMaintenance && isAdmin && (
        <div style={{
          background: 'linear-gradient(90deg, #b45309, #d97706)',
          color: '#fff',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          zIndex: 110,
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} />
            <span>🛠️ กำลังเปิดโหมดปิดปรับปรุงระบบ (Maintenance Mode) — ผู้ใช้ทั่วไปไม่สามารถเข้าใช้งานได้</span>
          </div>
          <button
            type="button"
            onClick={handleDisableMaintenance}
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ปิดโหมดปรับปรุงทันที
          </button>
        </div>
      )}

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
          <AdminDashboard currentUser={currentUser} onSettingsChange={refreshSettings} />
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
