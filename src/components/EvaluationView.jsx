import React, { useState, useEffect } from 'react';
import {
  getMasseuses,
  getBehaviorAssignments,
  getEvaluations,
  saveBehaviorSubScore,
  isEvaluationClosed,
  getSystemSettings,
  pushToCloud
} from '../data/mockData';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Lock,
  Clock,
  HeartHandshake,
  Shirt,
  Save
} from 'lucide-react';

import confetti from 'canvas-confetti';

export default function EvaluationView({ currentUser }) {
  const [masseuses, setMasseuses] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [systemSettings, setSystemSettings] = useState({});
  const [isClosed, setIsClosed] = useState(false);
  const [savingCardId, setSavingCardId] = useState(null);
  const [savedCardIds, setSavedCardIds] = useState(new Set());
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);


  useEffect(() => {
    const loadedMasseuses = getMasseuses();
    const loadedAssign = getBehaviorAssignments();
    const loadedEvals = getEvaluations();
    const loadedSettings = getSystemSettings();
    const closedStatus = isEvaluationClosed();

    setMasseuses(loadedMasseuses);
    setAssignments(loadedAssign);
    setEvaluations(loadedEvals);
    setSystemSettings(loadedSettings);
    setIsClosed(closedStatus);

    const handleSync = (e) => {
      if (e?.detail) {
        setEvaluations(e.detail);
      } else {
        setEvaluations(getEvaluations());
      }
    };
    window.addEventListener('evaluations_synced', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('evaluations_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [currentUser]);


  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSubScoreChange = (masseuseId, subKey, score) => {
    if (isClosed && currentUser.role !== 'admin') {
      alert('ระบบปิดรับการประเมินแล้ว ไม่สามารถบันทึกหรือเปลี่ยนคะแนนได้');
      return;
    }

    try {
      const updated = saveBehaviorSubScore(currentUser.id, masseuseId, subKey, score);
      setEvaluations({ ...updated });
      setSavedCardIds(prev => {
        const next = new Set(prev);
        next.delete(masseuseId);
        return next;
      });
      showToast(`เลือกคะแนน ${score} คะแนนเรียบร้อย`);
      checkCompletion(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveCard = async (m) => {
    if (isClosed && currentUser.role !== 'admin') {
      alert('ระบบปิดรับการประเมินแล้ว ไม่สามารถบันทึกหรือเปลี่ยนคะแนนได้');
      return;
    }
    setSavingCardId(m.id);
    try {
      await pushToCloud();
      setSavedCardIds(prev => new Set([...prev, m.id]));
      showToast(`บันทึกข้อมูลของ ${m.name} เรียบร้อยแล้ว`);
    } catch (err) {
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setSavingCardId(null);
    }
  };

  const handleSaveAll = async () => {
    if (isClosed && currentUser.role !== 'admin') {
      alert('ระบบปิดรับการประเมินแล้ว');
      return;
    }
    setIsGlobalSaving(true);
    try {
      await pushToCloud();
      setSavedCardIds(new Set(assignedMasseuses.map(m => m.id)));
      showToast('บันทึกข้อมูลการประเมินทั้งหมดเรียบร้อยแล้ว');
      if (completedCount === totalToEvaluate && totalToEvaluate > 0) {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsGlobalSaving(false);
    }
  };


  const checkCompletion = (currentEvals) => {
    const userBehavior = currentEvals[currentUser.id]?.behavior || {};
    const assignedIds = assignments[currentUser.id] || [];
    
    const isAllDone = assignedIds.length > 0 && assignedIds.every(id => {
      const evalItem = userBehavior[id];
      if (!evalItem) return false;
      if (typeof evalItem === 'number') return true;
      return evalItem.welcome !== undefined && evalItem.grooming !== undefined;
    });

    if (isAllDone) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const userBehaviorEvals = evaluations[currentUser.id]?.behavior || {};
  const assignedIds = assignments[currentUser.id] || [];
  const assignedMasseuses = masseuses.filter(m => assignedIds.includes(m.id));

  const filteredList = assignedMasseuses.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const evalItem = userBehaviorEvals[m.id];
    let isFullyDone = false;
    let isPartiallyDone = false;

    if (evalItem) {
      if (typeof evalItem === 'number') {
        isFullyDone = true;
      } else {
        const hasWelcome = evalItem.welcome !== undefined;
        const hasGrooming = evalItem.grooming !== undefined;
        isFullyDone = hasWelcome && hasGrooming;
        isPartiallyDone = hasWelcome || hasGrooming;
      }
    }

    if (statusFilter === 'pending') return matchesSearch && !isFullyDone;
    if (statusFilter === 'completed') return matchesSearch && isFullyDone;
    return matchesSearch;
  });

  const totalToEvaluate = assignedMasseuses.length;
  const completedCount = assignedMasseuses.filter(m => {
    const item = userBehaviorEvals[m.id];
    if (!item) return false;
    if (typeof item === 'number') return true;
    return item.welcome !== undefined && item.grooming !== undefined;
  }).length;

  const progressPercent = totalToEvaluate > 0 ? Math.round((completedCount / totalToEvaluate) * 100) : 0;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 40px 16px' }}>

      {/* System Lock / Closed Alert Banner */}
      {isClosed && (
        <div className="glass-panel animate-fade-in" style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#fda4af'
        }}>
          <Lock size={24} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
              ⛔ ระบบปิดรับการประเมินแล้ว (System Locked)
            </div>
            <div style={{ fontSize: '0.86rem', opacity: 0.9 }}>
              {systemSettings.deadline
                ? `สิ้นสุดกำหนดเวลาประเมินเมื่อ: ${new Date(systemSettings.deadline).toLocaleString('th-TH')}`
                : 'ผู้ดูแลระบบ (Admin) ปิดการประเมินชั่วคราว เจ้าหน้าที่ไม่สามารถให้คะแนนเพิ่มได้'
              }
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 25px rgba(20, 184, 166, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.92rem',
          fontWeight: 500
        }} className="animate-fade-in">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header Progress Card */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px 28px', marginBottom: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff',
                padding: '6px',
                borderRadius: '10px',
                display: 'inline-flex'
              }}>
                <Award size={20} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                การประเมินพฤติกรรมหมอนวด
              </h2>
              <span className="badge badge-purple" style={{ fontSize: '0.78rem' }}>
                กลุ่มสุ่ม 5 คน
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              คุณ <strong>{currentUser.name}</strong> ได้รับมอบหมายประเมินหมอนวดจำนวน <strong>{totalToEvaluate} คน</strong> โดยประเมิน 2 หัวข้อย่อย (คะแนน 1 - 10)
            </p>
          </div>

          {/* Progress Count Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: progressPercent === 100 ? '#2dd4bf' : 'var(--text-primary)' }}>
                {completedCount} / {totalToEvaluate} คน
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ประเมินครบทั้ง 2 ข้อ ({progressPercent}%)
              </div>
            </div>

            {progressPercent === 100 && (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(20, 184, 166, 0.2)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(20, 184, 166, 0.4)'
              }}>
                <CheckCircle2 size={26} />
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '10px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #14b8a6, #8b5cf6)',
            borderRadius: '6px',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Criteria Info Banner */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '24px',
        borderRadius: '16px',
        background: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.2)',
            color: '#a78bfa',
            padding: '8px',
            borderRadius: '10px',
            marginTop: '2px'
          }}>
            <HeartHandshake size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ddd6fe' }}>
              หัวข้อ 2.1: การต้อนรับ ดูแลผู้มารับบริการ
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ตั้งแต่เริ่ม จบเสร็จสิ้นบริการ ไหว้ ยิ้มแย้ม เอาใจใส่สอบถาม
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            background: 'rgba(20, 184, 166, 0.2)',
            color: '#2dd4bf',
            padding: '8px',
            borderRadius: '10px',
            marginTop: '2px'
          }}>
            <Shirt size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#99f6e4' }}>
              หัวข้อ 2.2: การแต่งกาย สุภาพเรียบร้อย เหมาะสม
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ยูนิฟอร์มสะอาด ทรงผมเรียบร้อย ถูกสุขอนามัย และกาลเทศะ
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px' }}
            placeholder="ค้นหาชื่อ หรือรหัสหมอนวด..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            ทั้งหมด ({totalToEvaluate})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            ยังไม่ครบ ({totalToEvaluate - completedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`btn ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            ครบแล้ว ({completedCount})
          </button>
        </div>
      </div>

      {/* Masseuses 2-Criteria Evaluation Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
        {filteredList.map(m => {
          const evalItem = userBehaviorEvals[m.id];
          let welcomeScore = null;
          let groomingScore = null;

          if (evalItem !== undefined && evalItem !== null) {
            if (typeof evalItem === 'number') {
              welcomeScore = evalItem;
              groomingScore = evalItem;
            } else if (typeof evalItem === 'object') {
              welcomeScore = evalItem.welcome ?? null;
              groomingScore = evalItem.grooming ?? null;
            }
          }

          const hasWelcome = welcomeScore !== null;
          const hasGrooming = groomingScore !== null;
          const isFullyRated = hasWelcome && hasGrooming;
          const avgScore = isFullyRated
            ? Math.round(((welcomeScore + groomingScore) / 2) * 10) / 10
            : (hasWelcome ? welcomeScore : (hasGrooming ? groomingScore : null));

          return (
            <div
              key={m.id}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                borderColor: isFullyRated ? 'rgba(20, 184, 166, 0.5)' : 'var(--border-color)',
                boxShadow: isFullyRated ? '0 10px 30px rgba(20, 184, 166, 0.1)' : 'none',
                opacity: isClosed && currentUser.role !== 'admin' ? 0.75 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {/* Card Header: Masseuse Info & Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}>
                    {m.name.charAt(2) || m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      รหัส: <strong>{m.code}</strong>
                    </div>
                  </div>
                </div>

                {isFullyRated ? (
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-teal" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                      <Check size={14} /> ครบ 2 ข้อ (เฉลี่ย {avgScore})
                    </span>
                  </div>
                ) : (hasWelcome || hasGrooming) ? (
                  <span className="badge badge-gold" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    ทำแล้ว 1/2 ข้อ
                  </span>
                ) : (
                  <span className="badge badge-gray" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    รอประเมิน
                  </span>
                )}
              </div>

              {/* Sub-Criteria 2.1: Welcome & Care */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <HeartHandshake size={16} color="#a78bfa" />
                    <span>2.1 การต้อนรับ ดูแลผู้มารับบริการ</span>
                  </div>
                  {welcomeScore !== null ? (
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#a78bfa' }}>
                      {welcomeScore} / 10
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ยังไม่ได้ลงคะแนน</span>
                  )}
                </div>

                {/* 1 - 10 Buttons for 2.1 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(scoreNum => {
                    const isSelected = welcomeScore === scoreNum;
                    return (
                      <button
                        key={scoreNum}
                        type="button"
                        disabled={isClosed && currentUser.role !== 'admin'}
                        onClick={() => handleSubScoreChange(m.id, 'welcome', scoreNum)}
                        className={`rating-button ${isSelected ? 'active' : ''}`}
                        style={{
                          width: '100%',
                          height: '34px',
                          fontSize: '0.85rem',
                          background: isSelected ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : undefined,
                          borderColor: isSelected ? '#8b5cf6' : undefined,
                          cursor: isClosed && currentUser.role !== 'admin' ? 'not-allowed' : 'pointer',
                          opacity: isClosed && currentUser.role !== 'admin' ? 0.6 : 1
                        }}
                      >
                        {scoreNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Criteria 2.2: Grooming & Uniform */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Shirt size={16} color="#2dd4bf" />
                    <span>2.2 การแต่งกาย สุภาพเรียบร้อย เหมาะสม</span>
                  </div>
                  {groomingScore !== null ? (
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2dd4bf' }}>
                      {groomingScore} / 10
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ยังไม่ได้ลงคะแนน</span>
                  )}
                </div>

                {/* 1 - 10 Buttons for 2.2 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(scoreNum => {
                    const isSelected = groomingScore === scoreNum;
                    return (
                      <button
                        key={scoreNum}
                        type="button"
                        disabled={isClosed && currentUser.role !== 'admin'}
                        onClick={() => handleSubScoreChange(m.id, 'grooming', scoreNum)}
                        className={`rating-button ${isSelected ? 'active' : ''}`}
                        style={{
                          width: '100%',
                          height: '34px',
                          fontSize: '0.85rem',
                          background: isSelected ? 'linear-gradient(135deg, #14b8a6, #0d9488)' : undefined,
                          borderColor: isSelected ? '#14b8a6' : undefined,
                          cursor: isClosed && currentUser.role !== 'admin' ? 'not-allowed' : 'pointer',
                          opacity: isClosed && currentUser.role !== 'admin' ? 0.6 : 1
                        }}
                      >
                        {scoreNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer: Save Button & Rating Summary */}
              <div style={{
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ fontSize: '0.84rem' }}>
                  {isFullyRated ? (
                    <span style={{ color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <CheckCircle2 size={16} /> ประเมินครบ 2 ข้อ (เฉลี่ย {avgScore} คะแนน)
                    </span>
                  ) : (hasWelcome || hasGrooming) ? (
                    <span style={{ color: '#f59e0b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> ยังค้างอีก 1 ข้อที่ยังไม่ได้ลงคะแนน
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      กรุณากดเลือกคะแนน 2.1 และ 2.2
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={(!hasWelcome && !hasGrooming) || (isClosed && currentUser.role !== 'admin') || savingCardId === m.id}
                  onClick={() => handleSaveCard(m)}
                  className={`btn ${isFullyRated ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    background: isFullyRated ? 'linear-gradient(135deg, #14b8a6, #0d9488)' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: (!hasWelcome && !hasGrooming) || (isClosed && currentUser.role !== 'admin') ? 'not-allowed' : 'pointer',
                    opacity: (!hasWelcome && !hasGrooming) ? 0.6 : 1
                  }}
                >
                  {savingCardId === m.id ? (
                    <span>กำลังบันทึก...</span>
                  ) : savedCardIds.has(m.id) ? (
                    <>
                      <Check size={16} /> บันทึกเรียบร้อย
                    </>
                  ) : (
                    <>
                      <Save size={16} /> บันทึกข้อมูล
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '20px' }}>
          ไม่พบรายชื่อหมอนวดในกลุ่มที่ได้รับมอบหมายตามเงื่อนไขการค้นหา
        </div>
      )}

      {/* Bottom Global Save Section (เมื่อประเมินเสร็จ หรือต้องการบันทึกความคืบหน้า) */}
      {totalToEvaluate > 0 && (
        <div className="glass-panel animate-fade-in" style={{
          marginTop: '28px',
          padding: '24px 28px',
          borderRadius: '20px',
          background: completedCount === totalToEvaluate && totalToEvaluate > 0
            ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(139, 92, 246, 0.18))'
            : 'rgba(255, 255, 255, 0.03)',
          border: completedCount === totalToEvaluate && totalToEvaluate > 0
            ? '2px solid rgba(20, 184, 166, 0.5)'
            : '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: completedCount === totalToEvaluate && totalToEvaluate > 0
            ? '0 12px 36px rgba(20, 184, 166, 0.2)'
            : 'none'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              {completedCount === totalToEvaluate && totalToEvaluate > 0 ? (
                <div style={{
                  background: 'rgba(20, 184, 166, 0.2)',
                  color: '#2dd4bf',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex'
                }}>
                  <CheckCircle2 size={24} />
                </div>
              ) : (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex'
                }}>
                  <Clock size={24} />
                </div>
              )}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {completedCount === totalToEvaluate && totalToEvaluate > 0
                  ? '🎉 ประเมินหมอนวดครบทั้งกลุ่มแล้ว!'
                  : `สรุปความคืบหน้าการประเมิน (${completedCount} / ${totalToEvaluate} คน)`
                }
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              {completedCount === totalToEvaluate && totalToEvaluate > 0
                ? 'คุณได้ประเมินหมอนวดครบทุกท่านเรียบร้อยแล้ว กดปุ่มด้านขวาเพื่อบันทึกและส่งข้อมูลผลการประเมินขึ้นระบบคลาวด์'
                : `ประเมินครบแล้ว ${completedCount} คน (ยังเหลืออีก ${totalToEvaluate - completedCount} คน) สามารถกดบันทึกข้อมูลเพื่ออัปเดตระบบได้ตลอดเวลา`
              }
            </p>
          </div>

          <button
            type="button"
            disabled={completedCount === 0 || (isClosed && currentUser.role !== 'admin') || isGlobalSaving}
            onClick={handleSaveAll}
            className="btn btn-primary"
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '12px',
              background: completedCount === totalToEvaluate && totalToEvaluate > 0
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
              boxShadow: completedCount === totalToEvaluate && totalToEvaluate > 0
                ? '0 8px 24px rgba(16, 185, 129, 0.4)'
                : '0 4px 16px rgba(20, 184, 166, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: completedCount === 0 || (isClosed && currentUser.role !== 'admin') ? 'not-allowed' : 'pointer',
              opacity: completedCount === 0 ? 0.6 : 1
            }}
          >
            {isGlobalSaving ? (
              <span>กำลังบันทึกข้อมูลเข้าระบบ...</span>
            ) : (
              <>
                <Save size={20} />
                {completedCount === totalToEvaluate && totalToEvaluate > 0
                  ? 'บันทึกข้อมูลการประเมินทั้งหมด (เสร็จสิ้น)'
                  : `บันทึกข้อมูลการประเมิน (${completedCount}/${totalToEvaluate} คน)`
                }
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal ยืนยันการบันทึกข้อมูลสำเร็จ */}
      {isSuccessModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '32px 28px',
            textAlign: 'center',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            border: '2px solid rgba(20, 184, 166, 0.5)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(16, 185, 129, 0.3))',
              color: '#2dd4bf',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '2px solid rgba(20, 184, 166, 0.5)'
            }}>
              <CheckCircle2 size={44} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              บันทึกข้อมูลการประเมินเรียบร้อยแล้ว!
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              ผลการประเมินหมอนวดจำนวน <strong>{completedCount} คน</strong> ของคุณ <strong>{currentUser.name}</strong> ได้รับการบันทึกและส่งข้อมูลเข้าสู่ระบบ Cloud เรียบร้อยสมบูรณ์แล้ว
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              marginBottom: '24px',
              border: '1px solid var(--border-color)',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                สรุปผลคะแนนหมอนวดที่คุณประเมิน:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assignedMasseuses.map(m => {
                  const evalItem = userBehaviorEvals[m.id];
                  const w = typeof evalItem === 'object' ? evalItem?.welcome : evalItem;
                  const g = typeof evalItem === 'object' ? evalItem?.grooming : evalItem;
                  const avg = (w !== null && g !== null && w !== undefined && g !== undefined)
                    ? Math.round(((Number(w) + Number(g)) / 2) * 10) / 10
                    : '-';
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {m.name} ({m.code})
                      </span>
                      <span style={{ color: '#2dd4bf', fontWeight: 700 }}>
                        เฉลี่ย {avg} คะแนน
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)'
              }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

