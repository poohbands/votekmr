import React, { useState, useEffect } from 'react';
import {
  getMasseuses,
  getBehaviorAssignments,
  getEvaluations,
  saveSingleScore,
  saveStaffEvaluations,
  isEvaluationClosed,
  getSystemSettings
} from '../data/mockData';
import {
  UserCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Check,
  Save,
  Info,
  Lock,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EvaluationView({ currentUser }) {
  const [activeCategory, setActiveCategory] = useState('responsibility');
  const [masseuses, setMasseuses] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [systemSettings, setSystemSettings] = useState({});
  const [isClosed, setIsClosed] = useState(false);

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

    if (currentUser.isBehaviorEvaluator) {
      setActiveCategory('behavior');
    } else {
      setActiveCategory('responsibility');
    }
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleScoreChange = (category, masseuseId, score) => {
    if (isClosed && currentUser.role !== 'admin') {
      alert('ระบบปิดรับการประเมินแล้ว ไม่สามารถบันทึกหรือเปลี่ยนคะแนนได้');
      return;
    }

    try {
      const updated = saveSingleScore(currentUser.id, category, masseuseId, score);
      setEvaluations({ ...updated });
      showToast(`บันทึกคะแนน ${score} คะแนนเรียบร้อย`);
      checkCompletion(category, updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const checkCompletion = (category, currentEvals) => {
    const userEvals = currentEvals[currentUser.id]?.[category] || {};

    if (category === 'behavior' && currentUser.isBehaviorEvaluator) {
      const assignedIds = assignments[currentUser.id] || [];
      const isAllDone = assignedIds.length > 0 && assignedIds.every(id => userEvals[id] !== undefined && userEvals[id] !== null);
      if (isAllDone) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } else if (category === 'responsibility') {
      const isAllDone = masseuses.length > 0 && masseuses.every(m => userEvals[m.id] !== undefined && userEvals[m.id] !== null);
      if (isAllDone) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    }
  };

  const userCategoryEvals = evaluations[currentUser.id]?.[activeCategory] || {};

  let listToDisplay = [];
  if (activeCategory === 'behavior') {
    if (currentUser.isBehaviorEvaluator) {
      const assignedIds = assignments[currentUser.id] || [];
      listToDisplay = masseuses.filter(m => assignedIds.includes(m.id));
    }
  } else {
    listToDisplay = masseuses;
  }

  const filteredList = listToDisplay.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const isEvaluated = userCategoryEvals[m.id] !== undefined && userCategoryEvals[m.id] !== null;

    if (statusFilter === 'pending') return matchesSearch && !isEvaluated;
    if (statusFilter === 'completed') return matchesSearch && isEvaluated;
    return matchesSearch;
  });

  const totalToEvaluate = listToDisplay.length;
  const completedCount = listToDisplay.filter(m => userCategoryEvals[m.id] !== undefined && userCategoryEvals[m.id] !== null).length;
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

      {/* Section Switcher Tabs */}
      <div className="glass-panel" style={{ padding: '8px', marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveCategory('behavior')}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeCategory === 'behavior'
              ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
              : 'transparent',
            color: activeCategory === 'behavior' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.98rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'var(--transition-fast)'
          }}
        >
          <Award size={20} />
          1. ประเมินพฤติกรรม (กลุ่มสุ่ม)
          {currentUser.isBehaviorEvaluator && (
            <span className="badge badge-purple" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              ผู้ประเมิน
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('responsibility')}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeCategory === 'responsibility'
              ? 'linear-gradient(135deg, #14b8a6, #0d9488)'
              : 'transparent',
            color: activeCategory === 'responsibility' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.98rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'var(--transition-fast)'
          }}
        >
          <UserCheck size={20} />
          2. ประเมินความรับผิดชอบในที่ทำงาน (หมอนวดทั้งหมด)
          <span className="badge badge-teal" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            เจ้าหน้าที่ทุกคน
          </span>
        </button>
      </div>

      {/* Behavior Assessment Non-Evaluator Notice */}
      {activeCategory === 'behavior' && !currentUser.isBehaviorEvaluator && (
        <div className="glass-panel animate-fade-in" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Info size={32} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
            สิทธิ์การประเมินพฤติกรรม
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            ส่วนประเมินพฤติกรรมนี้ได้รับการกำหนดให้ผู้ประเมินตามสิทธิ์ที่ Admin กำหนด สุ่มประเมินหมอนวดคนละกลุ่ม
            <br />
            คุณ ({currentUser.name}) สามารถทำรายการในหมวด <strong>"ประเมินความรับผิดชอบในที่ทำงาน"</strong> สำหรับหมอนวดทุกคนได้ตามปกติครับ
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveCategory('responsibility')}
          >
            <UserCheck size={18} />
            ไปยังหน้าประเมินความรับผิดชอบ
          </button>
        </div>
      )}

      {/* Evaluation Interface for Active User */}
      {(activeCategory === 'responsibility' || (activeCategory === 'behavior' && currentUser.isBehaviorEvaluator)) && (
        <div>
          {/* Header Progress Card */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeCategory === 'behavior' ? 'ประเมินพฤติกรรมหมอนวด' : 'ประเมินความรับผิดชอบในที่ทำงาน'}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {activeCategory === 'behavior'
                    ? `ได้รับสุ่มประเมินหมอนวดจำนวน ${totalToEvaluate} คน (คะแนน 1-10)`
                    : `ประเมินหมอนวดทั้งหมด ${totalToEvaluate} คน (คะแนน 1-10) คะแนนจะถูกนำไปเฉลี่ยร่วมกับเจ้าหน้าที่ทุกท่าน`
                  }
                </p>
              </div>

              {/* Progress Count Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: progressPercent === 100 ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                    {completedCount} / {totalToEvaluate}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ประเมินแล้ว ({progressPercent}%)
                  </div>
                </div>

                {progressPercent === 100 && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(20, 184, 166, 0.2)',
                    color: '#2dd4bf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #14b8a6, #8b5cf6)',
                borderRadius: '4px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Search & Filters */}
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
                ยังไม่ได้ประเมิน ({totalToEvaluate - completedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`btn ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                ประเมินแล้ว ({completedCount})
              </button>
            </div>
          </div>

          {/* Masseuses Evaluation Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {filteredList.map(m => {
              const currentScore = userCategoryEvals[m.id] ?? null;
              const isRated = currentScore !== null;

              return (
                <div
                  key={m.id}
                  className="glass-panel glass-card-interactive"
                  style={{
                    padding: '20px',
                    borderColor: isRated ? 'rgba(20, 184, 166, 0.4)' : 'var(--border-color)',
                    opacity: isClosed && currentUser.role !== 'admin' ? 0.75 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#fff',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                      }}>
                        {m.name.charAt(2) || m.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          รหัส: {m.code}
                        </div>
                      </div>
                    </div>

                    {isRated ? (
                      <span className="badge badge-teal">
                        <Check size={14} /> ประเมินแล้ว ({currentScore}/10)
                      </span>
                    ) : (
                      <span className="badge badge-gray">
                        รอประเมิน
                      </span>
                    )}
                  </div>

                  {/* Rating 1 - 10 Score Selector */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        ให้คะแนน (1 - 10):
                      </span>
                      {currentScore !== null && (
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                          {currentScore} คะแนน
                        </span>
                      )}
                    </div>

                    {/* 1 - 10 Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(scoreNum => {
                        const isSelected = currentScore === scoreNum;
                        return (
                          <button
                            key={scoreNum}
                            type="button"
                            disabled={isClosed && currentUser.role !== 'admin'}
                            onClick={() => handleScoreChange(activeCategory, m.id, scoreNum)}
                            className={`rating-button ${isSelected ? 'active' : ''}`}
                            style={{
                              width: '100%',
                              height: '34px',
                              fontSize: '0.85rem',
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
                </div>
              );
            })}
          </div>

          {filteredList.length === 0 && (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              ไม่พบรายชื่อหมอนวดตามเงื่อนไขการค้นหา
            </div>
          )}
        </div>
      )}

    </div>
  );
}
