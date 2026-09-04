import React, { useState } from 'react';
import { getStaffUsers } from '../data/mockData';
import { Lock, User, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setError('');

    const currentStaffList = getStaffUsers();
    const foundUser = currentStaffList.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(20, 184, 166, 0.4)',
            marginBottom: '16px'
          }}>
            <Sparkles size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            ระบบประเมินหมอนวด
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่ประจำการ
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              ชื่อผู้ใช้ (Username)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งาน..."
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              รหัสผ่าน (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '0.88rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: '14px', marginTop: '6px', fontSize: '1rem' }}>
            <Lock size={18} />
            เข้าสู่ระบบ
          </button>
        </form>

      </div>
    </div>
  );
}
