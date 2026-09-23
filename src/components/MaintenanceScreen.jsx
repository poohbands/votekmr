import React, { useState } from 'react';
import { Wrench, ShieldAlert, LogIn, LogOut, Lock, Sparkles, RefreshCw } from 'lucide-react';
import LoginModal from './LoginModal';

export default function MaintenanceScreen({ currentUser, maintenanceMessage, onAdminLogin, onLogout }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 100%)',
      color: '#fff',
      position: 'relative'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '560px',
        width: '100%',
        padding: '48px 36px',
        textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)',
        borderRadius: '24px',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        {/* Animated Maintenance Icon */}
        <div style={{
          width: '88px',
          height: '88px',
          borderRadius: '26px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.2))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 0 35px rgba(245, 158, 11, 0.3)',
          color: '#fbbf24'
        }}>
          <Wrench size={44} style={{ animation: 'spin 12s linear infinite' }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          margin: '0 0 10px 0',
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #fbbf24, #f97316)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ระบบปิดปรับปรุงชั่วคราว
        </h1>
        <div style={{
          display: 'inline-block',
          fontSize: '0.82rem',
          color: '#f59e0b',
          background: 'rgba(245, 158, 11, 0.15)',
          padding: '4px 14px',
          borderRadius: '9999px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '20px',
          fontWeight: 600
        }}>
          Maintenance Mode Active
        </div>

        {/* Custom Message Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '28px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: '#e2e8f0',
            margin: 0
          }}>
            {maintenanceMessage || 'ระบบกำลังปิดปรับปรุงชั่วคราว เพื่อบำรุงรักษาระบบและอัปเดตข้อมูล'}
          </p>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
          ขออภัยในความไม่สะดวก ระบบจะเปิดให้บริการอีกครั้งเมื่อการบำรุงรักษาเสร็จสิ้น
          <br />หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ (Admin)
        </p>

        {/* User Status / Action Buttons */}
        {currentUser ? (
          <div>
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px'
            }}>
              เข้าสู่ระบบในชื่อ: <strong>{currentUser.name}</strong> ({currentUser.username})
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={16} />
              ออกจากระบบ (Logout)
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowAdminLogin(true)}
              className="btn"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Lock size={18} />
              เข้าสู่ระบบสำหรับ Admin (Admin Login)
            </button>
          </div>
        )}
      </div>

      {/* Admin Login Modal in Maintenance Screen */}
      {showAdminLogin && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
            <button
              type="button"
              onClick={() => setShowAdminLogin(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 210,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <LoginModal onLogin={(user) => {
              setShowAdminLogin(false);
              onAdminLogin(user);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
