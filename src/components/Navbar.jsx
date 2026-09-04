import React from 'react';
import { LogOut, LayoutDashboard, ClipboardList, ShieldCheck, Sun, Moon, Sparkles, Eye } from 'lucide-react';

export default function Navbar({ currentUser, activeTab, setActiveTab, onLogout, theme, toggleTheme }) {
  const isAdmin = currentUser.role === 'admin';
  const hasDashboardAccess = isAdmin || Boolean(currentUser.canViewDashboard);

  return (
    <header className="glass-panel" style={{
      borderRadius: '0 0 20px 20px',
      margin: '0 0 24px 0',
      padding: '14px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)'
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              ระบบประเมินหมอนวด
            </h1>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              ศูนย์บริการสุขภาพและสปา (30 คน)
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '4px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('evaluation')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'evaluation' ? 'var(--accent-teal)' : 'transparent',
              color: activeTab === 'evaluation' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-fast)'
            }}
          >
            <ClipboardList size={18} />
            หน้าประเมินคะแนน
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'dashboard'
                ? (isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)')
                : 'transparent',
              color: activeTab === 'dashboard'
                ? '#ffffff'
                : (hasDashboardAccess ? 'var(--accent-teal)' : 'var(--text-muted)'),
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-fast)'
            }}
          >
            <LayoutDashboard size={18} />
            หน้ารายงานผล Dashboard
            {isAdmin ? (
              <span className="badge badge-gold" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                Admin
              </span>
            ) : hasDashboardAccess ? (
              <span className="badge badge-teal" style={{ padding: '2px 6px', fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                <Eye size={12} /> Read-Only
              </span>
            ) : (
              <span className="badge badge-gray" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                เฉพาะ Admin
              </span>
            )}
          </button>
        </div>

        {/* User Info & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* User Profile Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px 6px 6px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#ffffff'
            }}>
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {isAdmin ? 'Admin' : (hasDashboardAccess ? 'Staff (สิทธิ์ดู Dashboard)' : 'Staff (ผู้ประเมิน)')}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', width: '38px', height: '38px' }}
            title={theme === 'dark' ? 'เปลี่ยนเป็นสว่าง' : 'เปลี่ยนเป็นมืด'}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#8b5cf6" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
