import React, { useState, useEffect } from 'react';
import { getStaffUsers, pullFromCloud } from '../data/mockData';
import { Lock, User, KeyRound, Sparkles, AlertCircle, CloudCheck, RefreshCw } from 'lucide-react';

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Pull latest accounts from cloud database when login modal opens
    pullFromCloud().then(success => {
      if (isMounted) setCloudSynced(success);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Pull cloud data right before checking login credentials to ensure multi-device sync
    await pullFromCloud();
    setIsLoading(false);

    const currentStaffList = getStaffUsers();
    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    const foundUser = currentStaffList.find(u => {
      const matchUsername = u.username.toLowerCase() === inputUser || 
                            (Array.isArray(u.aliases) && u.aliases.some(a => a.toLowerCase() === inputUser));
      const matchPass = u.password === password || u.password === inputPass;
      return matchUsername && matchPass;
    });

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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
            กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่ประจำการ
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#2dd4bf', background: 'rgba(20, 184, 166, 0.12)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <CloudCheck size={14} />
            <span>เชื่อมต่อฐานข้อมูล Cloud (Realtime Sync)</span>
          </div>
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

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ padding: '14px', marginTop: '6px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
            {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

      </div>
    </div>
  );
}
