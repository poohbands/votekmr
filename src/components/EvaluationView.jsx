import React, { useState, useEffect } from 'react';
import {
  getMasseuses,
  getBehaviorAssignments,
  getEvaluations,
  saveBehaviorSubScore,
  isEvaluationClosed,
  getSystemSettings,
  pushToCloud,
  pullFromCloud,
  EVALUATION_CRITERIA
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
  Briefcase,
  Smile,
  CalendarCheck,
  Save
} from 'lucide-react';

import confetti from 'canvas-confetti';

const CRITERIA_ICONS = {
  welcome: HeartHandshake,
  grooming: Shirt,
  responsibility: Briefcase,
  volunteering: Smile,
  activity: CalendarCheck
};

const CRITERIA_CONFIG = EVALUATION_CRITERIA.map(c => ({
  ...c,
  icon: CRITERIA_ICONS[c.key] || Award
}));

const CATEGORY_GROUPS = [
  {
    categoryName: 'ข้อ 1: พฤติกรรมบริการ',
    badgeColor: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.12)',
    criteria: CRITERIA_CONFIG.filter(c => c.code.startsWith('1.'))
  },
  {
    categoryName: 'ข้อ 2: ความรับผิดชอบและการมีส่วนร่วม',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    criteria: CRITERIA_CONFIG.filter(c => c.code.startsWith('2.'))
  }
];

export default function EvaluationView({ currentUser }) {
  const [masseuses, setMasseuses] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [systemSettings, setSystemSettings] = useState({});
  const [isClosed, setIsClosed] = useState(false);
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Pull cloud first to get latest assignments + evaluations before rendering
    const initLoad = async () => {
      await pullFromCloud();
      if (!isMounted) return;
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
    };
    initLoad();

    const handleSync = (e) => {
      // Safely merge: never wipe existing evaluations with an empty/incomplete sync event
      const incoming = e?.detail;
      if (incoming && typeof incoming === 'object' && Object.keys(incoming).length > 0) {
        // Deep merge incoming with current state to avoid losing sub-scores (welcome/grooming)
        setEvaluations(prev => {
          const merged = { ...incoming };
          Object.keys(prev).forEach(staffId => {
            if (!merged[staffId]) {
              merged[staffId] = prev[staffId];
            } else {
              const prevBeh = prev[staffId]?.behavior || {};
              const inBeh = merged[staffId]?.behavior || {};
              // Deep merge each masseuse's sub-scores
              const mergedBeh = { ...prevBeh };
              Object.keys(inBeh).forEach(mId => {
                const prevScore = prevBeh[mId];
                const inScore = inBeh[mId];
                if (prevScore && inScore && typeof prevScore === 'object' && typeof inScore === 'object') {
                  // Deep merge: combine welcome + grooming from both sides
                  mergedBeh[mId] = { ...prevScore, ...inScore };
                } else {
                  mergedBeh[mId] = inScore ?? prevScore;
                }
              });
              merged[staffId] = { ...prev[staffId], ...merged[staffId], behavior: mergedBeh };
            }
          });
          return merged;
        });
      } else {
        // No detail or null (reset signal) — re-read from localStorage (which was already updated)
        setEvaluations(getEvaluations());
      }
      // Also refresh assignments and masseuses in case they changed on another device
      setAssignments(getBehaviorAssignments());
      setMasseuses(getMasseuses());
    };
    window.addEventListener('evaluations_synced', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
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
      showToast(`เลือกลงคะแนน ${score} คะแนนเรียบร้อย`);
      checkCompletion(updated);
    } catch (err) {
      alert(err.message);
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
      showToast('บันทึกข้อมูลการประเมินทั้งหมดเรียบร้อยแล้ว');
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
      setIsSuccessModalOpen(true);
    } catch (err) {
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsGlobalSaving(false);
    }
  };



  const CRITERIA_KEYS = ['welcome', 'grooming', 'responsibility', 'volunteering', 'activity'];

  const checkCompletion = (currentEvals) => {
    const userBehavior = currentEvals[currentUser.id]?.behavior || {};
    const assignedIds = assignments[currentUser.id] || [];
    const targetIds = assignedIds;
    
    const isAllDone = targetIds.length > 0 && targetIds.every(id => {
      const evalItem = userBehavior[id];
      if (!evalItem || typeof evalItem !== 'object') return false;
      return CRITERIA_KEYS.every(k => evalItem[k] !== undefined && evalItem[k] !== null);
    });

    if (isAllDone) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  const userBehaviorEvals = evaluations[currentUser.id]?.behavior || {};
  const assignedIds = assignments[currentUser.id] || [];
  const assignedMasseuses = masseuses.filter(m => assignedIds.includes(m.id));
  const activeMasseuseList = assignedMasseuses;

  const filteredList = activeMasseuseList.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const evalItem = userBehaviorEvals[m.id];
    let isFullyDone = false;

    if (evalItem && typeof evalItem === 'object') {
      const ratedCount = CRITERIA_KEYS.filter(k => evalItem[k] !== undefined && evalItem[k] !== null).length;
      isFullyDone = ratedCount === CRITERIA_KEYS.length;
    }

    if (statusFilter === 'pending') return matchesSearch && !isFullyDone;
    if (statusFilter === 'completed') return matchesSearch && isFullyDone;
    return matchesSearch;
  });

  const totalToEvaluate = activeMasseuseList.length;
  const completedCount = activeMasseuseList.filter(m => {
    const item = userBehaviorEvals[m.id];
    if (!item || typeof item !== 'object') return false;
    return CRITERIA_KEYS.every(k => item[k] !== undefined && item[k] !== null);
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
                กลุ่มที่ได้รับมอบหมาย {totalToEvaluate} คน
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              คุณ <strong>{currentUser.name}</strong> ได้รับมอบหมายประเมินหมอนวดจำนวน <strong>{totalToEvaluate} คน</strong> โดยประเมินครบ 5 หัวข้อย่อย (คะแนน 1 - 10)
            </p>
          </div>

          {/* Progress Count Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: progressPercent === 100 ? '#2dd4bf' : 'var(--text-primary)' }}>
                {completedCount} / {totalToEvaluate} คน
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ประเมินครบทั้ง 5 ข้อ ({progressPercent}%)
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
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px'
      }}>
        {CRITERIA_CONFIG.map(crit => {
          const IconComp = crit.icon;
          return (
            <div key={crit.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{
                background: `${crit.color}22`,
                color: crit.color,
                padding: '8px',
                borderRadius: '10px',
                marginTop: '2px',
                flexShrink: 0
              }}>
                <IconComp size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: crit.color }}>
                  {crit.code} {crit.shortTitle.replace(/^[0-9.]+\s*/, '')}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                  {crit.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

      {/* Masseuses 5-Criteria Evaluation Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px' }}>
        {filteredList.map(m => {
          const evalItem = userBehaviorEvals[m.id] || {};
          const scores = {};
          CRITERIA_CONFIG.forEach(c => {
            scores[c.key] = evalItem?.[c.key] !== undefined && evalItem?.[c.key] !== null ? Number(evalItem[c.key]) : null;
          });

          const ratedCount = CRITERIA_CONFIG.filter(c => scores[c.key] !== null).length;
          const isFullyRated = ratedCount === CRITERIA_CONFIG.length;
          const isPartiallyRated = ratedCount > 0 && !isFullyRated;

          const validScores = CRITERIA_CONFIG.map(c => scores[c.key]).filter(s => s !== null);
          const avgScore = validScores.length > 0
            ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
            : null;

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
                      <Check size={14} /> ครบ 5 ข้อ (เฉลี่ย {avgScore})
                    </span>
                  </div>
                ) : isPartiallyRated ? (
                  <span className="badge badge-gold" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    ทำแล้ว {ratedCount}/5 ข้อ
                  </span>
                ) : (
                  <span className="badge badge-gray" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    รอประเมิน
                  </span>
                )}
              </div>

              {/* Evaluation Categories and Criteria */}
              {CATEGORY_GROUPS.map((group, groupIdx) => (
                <div key={group.categoryName} style={{ marginBottom: groupIdx === 0 ? '20px' : '10px' }}>
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: group.badgeColor,
                    background: group.badgeBg,
                    padding: '3px 10px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {group.categoryName}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {group.criteria.map(crit => {
                      const IconComp = crit.icon;
                      const currentScore = scores[crit.key];
                      return (
                        <div key={crit.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <IconComp size={16} color={crit.color} />
                              <span>{crit.shortTitle}</span>
                            </div>
                            {currentScore !== null ? (
                              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: crit.color }}>
                                {currentScore} / 10
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ยังไม่ได้ลงคะแนน</span>
                            )}
                          </div>

                          {/* 1 - 10 Rating Buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(scoreNum => {
                              const isSelected = currentScore === scoreNum;
                              return (
                                <button
                                  key={scoreNum}
                                  type="button"
                                  disabled={isClosed && currentUser.role !== 'admin'}
                                  onClick={() => handleSubScoreChange(m.id, crit.key, scoreNum)}
                                  className={`rating-button ${isSelected ? 'active' : ''}`}
                                  style={{
                                    width: '100%',
                                    height: '34px',
                                    fontSize: '0.85rem',
                                    background: isSelected ? crit.gradient : undefined,
                                    borderColor: isSelected ? crit.color : undefined,
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
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Card Footer: Rating Summary */}
              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}>
                {isFullyRated ? (
                  <span style={{ color: '#2dd4bf', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> ประเมินครบทั้ง 5 ข้อแล้ว (เฉลี่ย {avgScore} คะแนน)
                  </span>
                ) : isPartiallyRated ? (
                  <span style={{ color: '#f59e0b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} /> ยังค้างอีก {5 - ratedCount} ข้อที่ยังไม่ได้ลงคะแนน
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    รอการลงคะแนน (กดเลือกคะแนน 1 - 10 ให้ครบ 5 ข้อ)
                  </span>
                )}
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

      {/* ONE LARGE MAIN SAVE BUTTON SECTION (ปุ่มหลักขนาดใหญ่ด้านล่างปุ่มเดียว) */}
      {totalToEvaluate > 0 && (
        <div className="glass-panel animate-fade-in" style={{
          marginTop: '32px',
          padding: '24px 32px',
          borderRadius: '24px',
          background: completedCount === totalToEvaluate && totalToEvaluate > 0
            ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.22), rgba(139, 92, 246, 0.22))'
            : 'rgba(255, 255, 255, 0.04)',
          border: completedCount === totalToEvaluate && totalToEvaluate > 0
            ? '2px solid rgba(20, 184, 166, 0.6)'
            : '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: completedCount === totalToEvaluate && totalToEvaluate > 0
            ? '0 16px 40px rgba(20, 184, 166, 0.25)'
            : '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              {completedCount === totalToEvaluate && totalToEvaluate > 0 ? (
                <div style={{
                  background: 'rgba(20, 184, 166, 0.25)',
                  color: '#2dd4bf',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex'
                }}>
                  <CheckCircle2 size={26} />
                </div>
              ) : (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#f59e0b',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex'
                }}>
                  <Clock size={26} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                  {completedCount === totalToEvaluate && totalToEvaluate > 0
                    ? '🎉 ประเมินหมอนวดครบทั้งกลุ่มแล้ว!'
                    : `สถานะการประเมิน: ประเมินแล้ว ${completedCount} จาก ${totalToEvaluate} คน`
                  }
                </h3>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {completedCount === totalToEvaluate && totalToEvaluate > 0
                    ? 'กรุณากดปุ่มด้านขวาเพื่อบันทึกข้อมูลการประเมินทั้งหมดเข้าสู่ระบบ Cloud'
                    : `สามารถกดปุ่มนี้เพื่อบันทึกข้อมูลที่ประเมินแล้วทั้งหมดได้ทันที`
                  }
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={((completedCount === 0 && Object.keys(userBehaviorEvals).length === 0) || (isClosed && currentUser.role !== 'admin') || isGlobalSaving)}
            onClick={handleSaveAll}
            className="btn btn-primary"
            style={{
              padding: '16px 36px',
              fontSize: '1.15rem',
              fontWeight: 800,
              borderRadius: '16px',
              background: completedCount === totalToEvaluate && totalToEvaluate > 0
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
              boxShadow: completedCount === totalToEvaluate && totalToEvaluate > 0
                ? '0 10px 30px rgba(16, 185, 129, 0.5)'
                : '0 8px 25px rgba(20, 184, 166, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              cursor: ((completedCount === 0 && Object.keys(userBehaviorEvals).length === 0) || (isClosed && currentUser.role !== 'admin') || isGlobalSaving) ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2px'
            }}
          >
            {isGlobalSaving ? (
              <span>กำลังบันทึกข้อมูลทั้งหมด...</span>
            ) : (
              <>
                <Save size={24} />
                <span>บันทึกข้อมูลการประเมินทั้งหมด</span>
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
                  const vals = (typeof evalItem === 'object' && evalItem !== null)
                    ? Object.values(evalItem).filter(v => typeof v === 'number')
                    : [];
                  const avg = vals.length > 0
                    ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
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

