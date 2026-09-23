import React, { useState, useEffect, useMemo } from 'react';
import {
  getStaffUsers,
  addStaffUser,
  updateStaffUser,
  deleteStaffUser,
  getMasseuses,
  addMasseuse,
  updateMasseuse,
  deleteMasseuse,
  calculateResults,
  seedMockEvaluations,
  resetEvaluationsOnly,
  generateBehaviorAssignments,
  getBehaviorAssignments,
  getSystemSettings,
  saveSystemSettings,
  getStaffProgressReport,
  hasAnyEvaluations
} from '../data/mockData';
import {
  Trophy,
  ShieldAlert,
  Search,
  Sparkles,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  Users,
  Award,
  UserCheck,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ListOrdered,
  Grid,
  Plus,
  Edit2,
  Check,
  X,
  UserPlus,
  ShieldCheck,
  Lock,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RotateCcw,
  Eye,
  Wrench,
  HeartHandshake,
  Shirt
} from 'lucide-react';
import ImportExportModal from './ImportExportModal';

export default function AdminDashboard({ currentUser, onSettingsChange }) {
  const isAdmin = currentUser.role === 'admin';
  const hasDashboardAccess = isAdmin || Boolean(currentUser.canViewDashboard);

  const [results, setResults] = useState([]);
  const [masseuses, setMasseuses] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [progressReport, setProgressReport] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [viewMode, setViewMode] = useState('leaderboard');
  const [evaluatorFilter, setEvaluatorFilter] = useState('all');
  const [assignments, setAssignments] = useState({});
  const [notice, setNotice] = useState('');
  const [systemSettings, setSystemSettings] = useState({ deadline: '', isLockedManually: false });

  // Modals State
  const [isManageMasseuseModalOpen, setIsManageMasseuseModalOpen] = useState(false);
  const [isManageStaffModalOpen, setIsManageStaffModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);


  // Masseuse Form State
  const [newMasseuseName, setNewMasseuseName] = useState('');
  const [newMasseuseCode, setNewMasseuseCode] = useState('');
  const [editingMasseuseId, setEditingMasseuseId] = useState(null);
  const [editMasseuseName, setEditMasseuseName] = useState('');
  const [editMasseuseCode, setEditMasseuseCode] = useState('');

  // Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('password123');
  const [newStaffRole, setNewStaffRole] = useState('staff');
  const [newStaffIsBehavior, setNewStaffIsBehavior] = useState(false);
  const [newStaffCanViewDashboard, setNewStaffCanViewDashboard] = useState(false);

  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffUsername, setEditStaffUsername] = useState('');
  const [editStaffPassword, setEditStaffPassword] = useState('');
  const [editStaffRole, setEditStaffRole] = useState('staff');
  const [editStaffIsBehavior, setEditStaffIsBehavior] = useState(false);
  const [editStaffCanViewDashboard, setEditStaffCanViewDashboard] = useState(false);

  // Settings State
  const [inputDeadline, setInputDeadline] = useState('');
  const [inputIsLocked, setInputIsLocked] = useState(false);
  const [inputIsMaintenance, setInputIsMaintenance] = useState(false);
  const [inputMaintenanceMessage, setInputMaintenanceMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const loadDashboardData = () => {
    const calculated = calculateResults();
    const loadedAssign = getBehaviorAssignments();
    const loadedMasseuses = getMasseuses();
    const loadedStaff = getStaffUsers();
    const loadedSettings = getSystemSettings();
    const report = getStaffProgressReport();

    setResults(calculated);
    setAssignments(loadedAssign);
    setMasseuses(loadedMasseuses);
    setStaffUsers(loadedStaff);
    setSystemSettings(loadedSettings);
    setProgressReport(report);
    setInputDeadline(loadedSettings.deadline || '');
    setInputIsLocked(Boolean(loadedSettings.isLockedManually));
    setInputIsMaintenance(Boolean(loadedSettings.isMaintenanceMode));
    setInputMaintenanceMessage(loadedSettings.maintenanceMessage || 'ระบบกำลังปิดปรับปรุงชั่วคราว เพื่อบำรุงรักษาระบบและอัปเดตข้อมูล');
  };

  const hasEvaluationsStarted = useMemo(() => {
    const hasScoresInResults = results.some(item =>
      item.welcomeScore !== null ||
      item.groomingScore !== null ||
      item.totalScore !== null ||
      item.behaviorScore !== null
    );
    if (hasScoresInResults) return true;
    return hasAnyEvaluations();
  }, [results]);

  useEffect(() => {
    if (hasDashboardAccess) {
      loadDashboardData();
    }

    const handleSync = () => {
      if (hasDashboardAccess) {
        loadDashboardData();
      }
    };
    window.addEventListener('evaluations_synced', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('evaluations_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [currentUser, hasDashboardAccess]);


  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  // --- SAVE SYSTEM SETTINGS, DEADLINE & MAINTENANCE MODE ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = saveSystemSettings({
      deadline: inputDeadline || null,
      isLockedManually: inputIsLocked,
      isMaintenanceMode: inputIsMaintenance,
      maintenanceMessage: inputMaintenanceMessage
    });
    setSystemSettings(updated);
    setIsSettingsModalOpen(false);
    loadDashboardData();
    if (onSettingsChange) onSettingsChange();
    showNotice('บันทึกการตั้งค่าระบบและ Maintenance Mode เรียบร้อยแล้ว!');
  };

  // --- STAFF MANAGEMENT HANDLERS ---
  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUsername.trim()) return;

    addStaffUser({
      name: newStaffName.trim(),
      username: newStaffUsername.trim().toLowerCase(),
      password: newStaffPassword.trim() || 'password123',
      role: newStaffRole,
      isBehaviorEvaluator: newStaffIsBehavior,
      canViewDashboard: newStaffCanViewDashboard
    });

    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffPassword('password123');
    setNewStaffRole('staff');
    setNewStaffIsBehavior(false);
    setNewStaffCanViewDashboard(false);

    loadDashboardData();
    showNotice('เพิ่มเจ้าหน้าที่ใหม่และอัปเดตสิทธิ์เรียบร้อยแล้ว!');
  };

  const startEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setEditStaffName(staff.name);
    setEditStaffUsername(staff.username);
    setEditStaffPassword(staff.password);
    setEditStaffRole(staff.role);
    setEditStaffIsBehavior(Boolean(staff.isBehaviorEvaluator));
    setEditStaffCanViewDashboard(Boolean(staff.canViewDashboard));
  };

  const handleSaveStaffEdit = (id) => {
    if (!editStaffName.trim() || !editStaffUsername.trim()) return;

    updateStaffUser(id, {
      name: editStaffName.trim(),
      username: editStaffUsername.trim().toLowerCase(),
      password: editStaffPassword.trim(),
      role: editStaffRole,
      isBehaviorEvaluator: editStaffIsBehavior,
      canViewDashboard: editStaffCanViewDashboard
    });

    setEditingStaffId(null);
    loadDashboardData();
    showNotice('แก้ไขข้อมูลและสิทธิ์เจ้าหน้าที่เรียบร้อยแล้ว!');
  };

  const handleToggleBehaviorPermission = (staff) => {
    updateStaffUser(staff.id, {
      isBehaviorEvaluator: !staff.isBehaviorEvaluator
    });
    loadDashboardData();
    showNotice(`ปรับสิทธิ์ประเมินพฤติกรรมของ ${staff.name} เรียบร้อยแล้ว`);
  };

  const handleToggleDashboardPermission = (staff) => {
    updateStaffUser(staff.id, {
      canViewDashboard: !staff.canViewDashboard
    });
    loadDashboardData();
    showNotice(`ปรับสิทธิ์ดู Dashboard ของ ${staff.name} เรียบร้อยแล้ว`);
  };

  const handleDeleteStaff = (id, name) => {
    if (staffUsers.length <= 1) {
      alert('ไม่สามารถลบเจ้าหน้าที่คนสุดท้ายได้');
      return;
    }
    if (window.confirm(`คุณต้องการลบบัญชีเจ้าหน้าที่ "${name}" ออกจากระบบใช่หรือไม่?`)) {
      deleteStaffUser(id);
      loadDashboardData();
      showNotice(`ลบบัญชีเจ้าหน้าที่ "${name}" เรียบร้อยแล้ว`);
    }
  };

  // --- MASSEUSE MANAGEMENT HANDLERS ---
  const handleAddMasseuse = (e) => {
    e.preventDefault();
    if (!newMasseuseName.trim()) return;
    addMasseuse(newMasseuseName.trim(), newMasseuseCode.trim());
    setNewMasseuseName('');
    setNewMasseuseCode('');
    loadDashboardData();
    showNotice('เพิ่มรายชื่อหมอนวดเรียบร้อยแล้ว!');
  };

  const startEditMasseuse = (m) => {
    setEditingMasseuseId(m.id);
    setEditMasseuseName(m.name);
    setEditMasseuseCode(m.code);
  };

  const handleSaveMasseuseEdit = (id) => {
    if (!editMasseuseName.trim()) return;
    updateMasseuse(id, editMasseuseName.trim(), editMasseuseCode.trim());
    setEditingMasseuseId(null);
    loadDashboardData();
    showNotice('แก้ไขข้อมูลหมอนวดเรียบร้อยแล้ว!');
  };

  const handleDeleteMasseuse = (id, name) => {
    if (window.confirm(`คุณต้องการลบรายชื่อ "${name}" ออกจากระบบใช่หรือไม่?`)) {
      deleteMasseuse(id);
      loadDashboardData();
      showNotice(`ลบรายชื่อ "${name}" เรียบร้อยแล้ว`);
    }
  };

  const handleSeedDemo = () => {
    if (window.confirm('คุณต้องการโหลดข้อมูลประเมินตัวอย่าง (Demo Data) เพื่อทดสอบสรุปผลและจัดอันดับใช่หรือไม่?')) {
      seedMockEvaluations();
      loadDashboardData();
      showNotice('เติมข้อมูลประเมินตัวอย่างเรียบร้อยแล้ว!');
    }
  };

  const handleReRandomize = () => {
    if (hasEvaluationsStarted) {
      alert('⚠️ ไม่สามารถสุ่มจัดกลุ่มใหม่ได้ เนื่องจากมีการเริ่มประเมินคะแนนในระบบแล้ว หากต้องการสุ่มกลุ่มใหม่ กรุณารีเซ็ตคะแนนประเมินก่อน');
      return;
    }
    if (window.confirm('คุณต้องการสุ่มจับคู่ประเมินพฤติกรรมใหม่ใช่หรือไม่?')) {
      generateBehaviorAssignments(true);
      loadDashboardData();
      showNotice('สุ่มแบ่งกลุ่มพฤติกรรมต่อผู้ประเมินใหม่เรียบร้อยแล้ว!');
    }
  };

  // 1-Click System Evaluation Reset
  const handleResetEvaluations = async () => {
    if (window.confirm('⚠️ ยืนยันการรีเซ็ตคะแนนประเมิน: คุณต้องการล้างข้อมูลคะแนนประเมินของหมอนวดและผู้ประเมินทุกคนในระบบให้เป็นค่าว่างทั้งหมดใช่หรือไม่?')) {
      setIsResetting(true);
      try {
        await resetEvaluationsOnly();
        loadDashboardData();
        showNotice('🔄 ล้างข้อมูลคะแนนประเมินทั้งหมดในระบบเรียบร้อยแล้ว!');
      } catch (err) {
        console.error('Reset error:', err);
        showNotice('เกิดข้อผิดพลาดในการเชื่อมต่อ Cloud แต่ข้อมูลในเครื่องถูกรีเซ็ตแล้ว');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "อันดับ,รหัส,ชื่อหมอนวด,ผู้ประเมินพฤติกรรม,ข้อ 2.1 การต้อนรับ,ข้อ 2.2 การแต่งกาย,คะแนนรวมเฉลี่ยพฤติกรรม\n";

    results.forEach(item => {
      const row = [
        item.rank,
        item.masseuse.code,
        `"${item.masseuse.name}"`,
        `"${item.assignedBehaviorStaffName}"`,
        item.welcomeScore !== null ? item.welcomeScore : '-',
        item.groomingScore !== null ? item.groomingScore : '-',
        item.totalScore !== null ? item.totalScore.toFixed(2) : '-'
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `masseuse_evaluation_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('ส่งออกไฟล์ CSV เรียบร้อยแล้ว');
  };

  if (!hasDashboardAccess) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '40px 30px', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            color: 'var(--accent-rose)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={48} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-rose)' }}>
            เข้าถึงถูกปฏิเสธ (Access Denied)
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 24px auto' }}>
            หน้ารายงานผล Dashboard นี้ถูกจำกัดการเข้าถึงเฉพาะ Admin หรือผู้ได้รับสิทธิ์ดูรายงานผลเท่านั้น
          </p>

          <div style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            fontSize: '0.95rem',
            color: 'var(--text-muted)'
          }}>
            ผู้ใช้งานปัจจุบัน: <strong>{currentUser.name}</strong> ({currentUser.username})
          </div>
        </div>
      </div>
    );
  }

  const myGroupResults = results.filter(r => r.assignedBehaviorStaffId === currentUser.id);
  const myGroupCount = myGroupResults.length;
  const myGroupCompleted = myGroupResults.filter(r => r.totalScore !== null).length;
  const totalCompletedCount = results.filter(r => r.totalScore !== null).length;
  const totalPendingCount = results.filter(r => r.totalScore === null).length;

  let displayedResults = results.filter(r => {
    const matchesSearch = r.masseuse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.masseuse.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (evaluatorFilter === 'my_group') {
      return r.assignedBehaviorStaffId === currentUser.id;
    }
    if (evaluatorFilter === 'evaluated') {
      return r.totalScore !== null;
    }
    if (evaluatorFilter === 'pending') {
      return r.totalScore === null;
    }
    if (evaluatorFilter !== 'all') {
      return r.assignedBehaviorStaffId === evaluatorFilter;
    }
    return true;
  });

  if (sortBy === 'welcome') {
    displayedResults.sort((a, b) => (b.welcomeScore || 0) - (a.welcomeScore || 0));
  } else if (sortBy === 'grooming') {
    displayedResults.sort((a, b) => (b.groomingScore || 0) - (a.groomingScore || 0));
  } else if (sortBy === 'name') {
    displayedResults.sort((a, b) => a.masseuse.name.localeCompare(b.masseuse.name, 'th'));
  } else {
    displayedResults.sort((a, b) => {
      if (a.totalScore === null && b.totalScore === null) return 0;
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      return b.totalScore - a.totalScore;
    });
  }

  const totalMasseuses = results.length;
  const topRanked = results.find(r => r.rank === 1 && r.totalScore !== null);
  
  const validWelcomeScores = results.map(r => r.welcomeScore).filter(s => s !== null && s !== undefined);
  const avgWelcomeOverall = validWelcomeScores.length > 0
    ? (validWelcomeScores.reduce((a, b) => a + b, 0) / validWelcomeScores.length).toFixed(2)
    : '-';

  const validGroomingScores = results.map(r => r.groomingScore).filter(s => s !== null && s !== undefined);
  const avgGroomingOverall = validGroomingScores.length > 0
    ? (validGroomingScores.reduce((a, b) => a + b, 0) / validGroomingScores.length).toFixed(2)
    : '-';

  const validBehaviorScores = results.map(r => r.behaviorScore).filter(s => s !== null && s !== undefined);
  const avgBehaviorOverall = validBehaviorScores.length > 0
    ? (validBehaviorScores.reduce((a, b) => a + b, 0) / validBehaviorScores.length).toFixed(2)
    : '-';

  const behaviorEvaluatorsList = staffUsers.filter(s => s.isBehaviorEvaluator);
  const fullyCompletedStaffCount = progressReport.filter(p => p.isFullyCompleted).length;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 50px 16px' }}>

      {/* Notice Banner */}
      {notice && (
        <div className="animate-fade-in" style={{
          background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={20} />
          {notice}
        </div>
      )}

      {/* System Status & Maintenance Card */}
      <div className="glass-panel" style={{
        padding: '16px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderColor: systemSettings.isMaintenanceMode || systemSettings.isLockedManually
          ? 'rgba(245, 158, 11, 0.4)'
          : 'var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Clock size={22} color={systemSettings.isMaintenanceMode ? '#f59e0b' : '#14b8a6'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>สถานะระบบ:</span>
            {systemSettings.isMaintenanceMode ? (
              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={14} /> เปิดใช้งาน Maintenance Mode อยู่
              </span>
            ) : (
              <span className="badge badge-teal">เปิดให้บริการปกติ</span>
            )}

            {systemSettings.deadline ? (
              <span className="badge badge-teal">
                <Calendar size={14} /> สิ้นสุด: {new Date(systemSettings.deadline).toLocaleString('th-TH')}
              </span>
            ) : (
              <span className="badge badge-gray">ไม่มีกำหนดเวลาปิด</span>
            )}

            {systemSettings.isLockedManually && (
              <span className="badge badge-rose" style={{ background: 'rgba(244,63,94,0.2)', color: '#fda4af' }}>
                ปิดรับการประเมินแล้ว
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Clock size={16} />
            ตั้งค่าระบบ & Maintenance Mode
          </button>
        )}
      </div>

      {/* Header Controls Banner */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                แดชบอร์ดสรุปผลและจัดอันดับ ({currentUser.name})
              </h2>
              {isAdmin ? (
                <span className="badge badge-gold">
                  Admin Exclusive
                </span>
              ) : (
                <span className="badge badge-teal" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                  <Eye size={14} /> สิทธิ์ดูรายงานผล (Read-Only)
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              สรุปคะแนนประเมินพฤติกรรมหมอนวด {totalMasseuses} คน (แบ่งกลุ่มละ 5 คน) จากผู้ประเมิน {staffUsers.length} คน
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleResetEvaluations}
                  disabled={isResetting}
                  className="btn btn-danger"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    opacity: isResetting ? 0.7 : 1,
                    cursor: isResetting ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="ล้างข้อมูลคะแนนประเมินทั้งหมดในระบบกลับเป็นเริ่มต้นด้วยปุ่มเดียว"
                >
                  <RotateCcw size={16} className={isResetting ? 'animate-spin' : ''} />
                  {isResetting ? 'กำลังล้างคะแนนประเมิน...' : 'รีเซ็ตคะแนนประเมิน (1-Click)'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsManageStaffModalOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.88rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <ShieldCheck size={16} />
                  จัดการเจ้าหน้าที่ & สิทธิ์ ({staffUsers.length} คน)
                </button>

                <button
                  type="button"
                  onClick={() => setIsManageMasseuseModalOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.88rem', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
                >
                  <UserPlus size={16} />
                  จัดการรายชื่อหมอนวด ({totalMasseuses} คน)
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportExportModalOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.88rem', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
                  title="นำเข้าหรือส่งออกรายชื่อหมอนวด (CSV, JSON, คัดลอก-วางรายชื่อ)"
                >
                  <FileSpreadsheet size={16} />
                  นำเข้า / ส่งออกรายชื่อ (Import/Export)
                </button>
                
                <button type="button" onClick={handleSeedDemo} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  <Sparkles size={16} />
                  เติมข้อมูลตัวอย่าง (Demo)
                </button>

                <button
                  type="button"
                  onClick={handleReRandomize}
                  disabled={hasEvaluationsStarted}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.85rem',
                    opacity: hasEvaluationsStarted ? 0.45 : 1,
                    cursor: hasEvaluationsStarted ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={
                    hasEvaluationsStarted
                      ? 'ไม่สามารถสุ่มจัดกลุ่มใหม่ได้ เนื่องจากเริ่มมีการประเมินคะแนนแล้ว (ต้องกดรีเซ็ตคะแนนประเมินก่อน)'
                      : 'สุ่มจัดกลุ่มหมอนวดใหม่ (กลุ่มละ 5 คน)'
                  }
                >
                  <RefreshCw size={16} />
                  สุ่มจัดกลุ่มหมอนวดใหม่ (กลุ่มละ 5 คน)
                  {hasEvaluationsStarted && (
                    <span style={{
                      fontSize: '0.72rem',
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginLeft: '2px',
                      fontWeight: 700
                    }}>
                      ล็อกแล้ว
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Read-Only & Admin can both export CSV */}
            <button type="button" onClick={handleExportCSV} className="btn btn-secondary" style={{ fontSize: '0.88rem' }}>
              <FileSpreadsheet size={16} />
              ส่งออกไฟล์ CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Top Rated Therapist */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, color: '#f59e0b' }}>
            <Trophy size={100} />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
            🏆 หมอนวดอันดับ 1 (สูงสุด)
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {topRanked ? topRanked.masseuse.name : 'รอสรุปผล'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {topRanked ? `คะแนนรวมเฉลี่ย: ${topRanked.totalScore?.toFixed(2)} / 10` : 'ยังไม่มีข้อมูล'}
          </div>
        </div>

        {/* Card 2: Staff Completion Progress Counter */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
            📊 ความก้าวหน้าผู้ประเมิน
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
            {fullyCompletedStaffCount} / {staffUsers.length} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>คน</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            ประเมินครบกลุ่ม 5 คนสมบูรณ์แล้ว
          </div>
        </div>

        {/* Card 3: Avg Welcome Score */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
            🤝 คะแนนเฉลี่ย 2.1 (การต้อนรับ)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#a78bfa' }}>
            {avgWelcomeOverall} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 10</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            การต้อนรับ ดูแลผู้มารับบริการ
          </div>
        </div>

        {/* Card 4: Avg Grooming Score */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
            👔 คะแนนเฉลี่ย 2.2 (การแต่งกาย)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2dd4bf' }}>
            {avgGroomingOverall} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 10</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            การแต่งกาย สุภาพเรียบร้อย เหมาะสม
          </div>
        </div>
      </div>

      {/* Information Banner about Evaluator Grouping & Quick Scope Filters */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '0.88rem',
        borderRadius: 'var(--radius-lg)',
        borderLeft: '4px solid #14b8a6'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(20, 184, 166, 0.2)',
            color: '#2dd4bf',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>
              สถานะ: คุณ ({currentUser.name}) ประเมินกลุ่มของคุณเสร็จสิ้นแล้ว {myGroupCompleted} / {myGroupCount} คน
              {totalPendingCount > 0 ? (
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> (หมอนวดอีก {totalPendingCount} คน อยู่ในกลุ่มของผู้ประเมินท่านอื่น)</span>
              ) : (
                <span style={{ color: '#2dd4bf', fontWeight: 600 }}> (ประเมินครบถ้วนทั้งระบบแล้ว 🎉)</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              💡 แต่ละคนจะได้รับมอบหมาย 5 คน เพื่อกระจายการประเมิน (คลิกปุ่มตัวกรองด้านขวาเพื่อดูเฉพาะกลุ่มที่สนใจ)
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setEvaluatorFilter('all')}
            className={`btn ${evaluatorFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px' }}
          >
            ทั้งหมด ({totalMasseuses})
          </button>
          <button
            type="button"
            onClick={() => setEvaluatorFilter('my_group')}
            className={`btn ${evaluatorFilter === 'my_group' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              fontSize: '0.82rem',
              padding: '6px 14px',
              borderRadius: '8px',
              background: evaluatorFilter === 'my_group' ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
              fontWeight: 600
            }}
          >
            กลุ่มของฉัน ({myGroupCompleted}/{myGroupCount})
          </button>
          <button
            type="button"
            onClick={() => setEvaluatorFilter('evaluated')}
            className={`btn ${evaluatorFilter === 'evaluated' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px' }}
          >
            ประเมินแล้ว ({totalCompletedCount})
          </button>
          <button
            type="button"
            onClick={() => setEvaluatorFilter('pending')}
            className={`btn ${evaluatorFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: '8px' }}
          >
            รอผู้ประเมินอื่น ({totalPendingCount})
          </button>
        </div>
      </div>

      {/* Table Toolbar View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '38px' }}
            placeholder="ค้นหาชื่อหมอนวด..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {viewMode !== 'progress' && (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>เรียงลำดับ:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                <option value="rank">ตามอันดับคะแนนรวม (Rank)</option>
                <option value="welcome">คะแนนการต้อนรับสูงสุด (2.1)</option>
                <option value="grooming">คะแนนการแต่งกายสูงสุด (2.2)</option>
                <option value="name">เรียงตามชื่อ</option>
              </select>
            </>
          )}

          <div style={{ display: 'flex', background: 'rgba(15,23,42,0.5)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setViewMode('leaderboard')}
              className={`btn ${viewMode === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              <ListOrdered size={16} /> ตารางสรุปอันดับ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`btn ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              <Grid size={16} /> ตารางกลุ่มประเมิน Matrix
            </button>
            <button
              type="button"
              onClick={() => setViewMode('progress')}
              className={`btn ${viewMode === 'progress' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              <BarChart3 size={16} /> รายงานความก้าวหน้าเจ้าหน้าที่
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: LEADERBOARD TABLE */}
      {viewMode === 'leaderboard' && (
        <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>อันดับ</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>ชื่อหมอนวด</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>ผู้ประเมิน</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#38bdf8' }}>ข้อ 2.1 การต้อนรับ (10)</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: '#fb7185' }}>ข้อ 2.2 การแต่งกาย (10)</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--accent-gold)' }}>คะแนนเฉลี่ยพฤติกรรม</th>
                <th style={{ padding: '14px 16px', fontWeight: 600 }}>สถานะการประเมิน</th>
              </tr>
            </thead>
            <tbody>
              {displayedResults.map(item => {
                const isTop3 = item.rank <= 3 && item.rank !== '-';
                const isComplete = item.welcomeScore !== null && item.groomingScore !== null;
                const isPartial = (item.welcomeScore !== null || item.groomingScore !== null) && !isComplete;

                return (
                  <tr
                    key={item.masseuse.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div className={`rank-badge ${
                        item.rank === 1 ? 'rank-1' :
                        item.rank === 2 ? 'rank-2' :
                        item.rank === 3 ? 'rank-3' : 'rank-normal'
                      }`}>
                        {item.rank}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.masseuse.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.masseuse.code}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
                        {item.assignedBehaviorStaffName}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {item.welcomeScore !== null ? (
                        <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '1rem' }}>
                          {item.welcomeScore} / 10
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ยังไม่ประเมิน</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {item.groomingScore !== null ? (
                        <span style={{ fontWeight: 700, color: '#fb7185', fontSize: '1rem' }}>
                          {item.groomingScore} / 10
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ยังไม่ประเมิน</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {item.totalScore !== null ? (
                        <div style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: isTop3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          border: isTop3 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          color: isTop3 ? 'var(--accent-gold)' : 'var(--text-primary)'
                        }}>
                          {item.totalScore.toFixed(1)} / 10
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {isComplete ? (
                        <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> ประเมินเสร็จสิ้น
                        </span>
                      ) : isPartial ? (
                        <span className="badge badge-gold">ประเมินบางข้อ</span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                          รอ {item.assignedBehaviorStaffName} ประเมิน
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: FULL BREAKDOWN MATRIX TABLE (กลุ่มผู้ประเมิน 6 คน คนละ 5 ราย) */}
      {viewMode === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {staffUsers.filter(s => s.isBehaviorEvaluator).map(evaluator => {
              const assignedMasseuses = results.filter(r => r.assignedBehaviorStaffId === evaluator.id);
              const completedCount = assignedMasseuses.filter(r => r.welcomeScore !== null && r.groomingScore !== null).length;
              const isAllDone = assignedMasseuses.length > 0 && completedCount === assignedMasseuses.length;

              return (
                <div
                  key={evaluator.id}
                  className="glass-panel"
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-lg)',
                    border: isAllDone ? '1px solid rgba(45, 212, 191, 0.4)' : '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}>
                        {evaluator.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {evaluator.name}
                          {evaluator.role === 'admin' && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Admin</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          @{evaluator.username} • กลุ่มสุ่ม {assignedMasseuses.length} คน
                        </div>
                      </div>
                    </div>

                    <div>
                      {isAllDone ? (
                        <span className="badge badge-teal" style={{ fontSize: '0.75rem' }}>
                          <CheckCircle2 size={13} /> ครบ {completedCount}/{assignedMasseuses.length}
                        </span>
                      ) : (
                        <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                          {completedCount}/{assignedMasseuses.length} คน
                        </span>
                      )}
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '6px 8px' }}>หมอนวด</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#38bdf8' }}>2.1 ต้อนรับ</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#fb7185' }}>2.2 แต่งกาย</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--accent-gold)' }}>เฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedMasseuses.map((item, idx) => (
                        <tr key={item.masseuse.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {idx + 1}. {item.masseuse.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {item.masseuse.code}
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: item.welcomeScore !== null ? '#38bdf8' : 'var(--text-muted)' }}>
                            {item.welcomeScore !== null ? item.welcomeScore : '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: item.groomingScore !== null ? '#fb7185' : 'var(--text-muted)' }}>
                            {item.groomingScore !== null ? item.groomingScore : '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: item.totalScore !== null ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                            {item.totalScore !== null ? item.totalScore.toFixed(1) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: STAFF EVALUATION PROGRESS REPORT (หน้ารายงานความก้าวหน้า) */}
      {viewMode === 'progress' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} color="#14b8a6" />
            รายงานความก้าวหน้าการประเมินของเจ้าหน้าที่แต่ละคน
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {progressReport.map(item => (
              <div
                key={item.staff.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: item.staff.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff'
                    }}>
                      {item.staff.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.staff.name}
                        {item.staff.role === 'admin' && <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Admin</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Username: {item.staff.username}
                      </div>
                    </div>
                  </div>

                  {item.isFullyCompleted ? (
                    <span className="badge badge-teal">
                      <CheckCircle2 size={14} /> ครบ 100%
                    </span>
                  ) : (
                    <span className="badge badge-gold">
                      {item.overallPercent}%
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  {item.isBehaviorEvaluator && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>ประเมินพฤติกรรม (กลุ่มสุ่ม {item.behTotal} คน):</span>
                        <span style={{ fontWeight: 700, color: item.isFullyCompleted ? '#2dd4bf' : '#a78bfa' }}>
                          {item.behCompleted} / {item.behTotal} คน ({item.behPercent}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.behPercent}%`,
                          background: item.isFullyCompleted ? 'linear-gradient(90deg, #14b8a6, #2dd4bf)' : 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>หัวข้อ 2.1 การต้อนรับ & 2.2 การแต่งกาย</span>
                        <span>{item.isFullyCompleted ? 'ประเมินครบถ้วน' : `คงเหลือ ${item.behTotal - item.behCompleted} คน`}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM SETTINGS & DEADLINE MODAL */}
      {isSettingsModalOpen && isAdmin && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={22} color="#14b8a6" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  กำหนดเวลา & ปิดระบบการประเมิน
                </h3>
              </div>
              <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  วัน-เดือน-ปี และ เวลา สิ้นสุดการประเมิน (Deadline)
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={inputDeadline}
                  onChange={e => setInputDeadline(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  เมื่อเลยกำหนดเวลานี้ ระบบจะปิดรับการประเมินโดยอัตโนมัติ
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.92rem' }}>
                  <input
                    type="checkbox"
                    checked={inputIsLocked}
                    onChange={e => setInputIsLocked(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#f43f5e' }}
                  />
                  <span style={{ fontWeight: 600, color: inputIsLocked ? '#fda4af' : 'var(--text-primary)' }}>
                    สั่งปิดรับการประเมินทันที (Manual Lock)
                  </span>
                </label>
              </div>

              {/* MAINTENANCE MODE CONTROLS */}
              <div style={{
                borderTop: '1px solid var(--border-color)',
                background: inputIsMaintenance ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                border: inputIsMaintenance ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Wrench size={18} color={inputIsMaintenance ? '#f59e0b' : 'var(--text-muted)'} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: inputIsMaintenance ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                    โหมดปิดปรับปรุงระบบ (Maintenance Mode)
                  </span>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: inputIsMaintenance ? '10px' : '0' }}>
                  <input
                    type="checkbox"
                    checked={inputIsMaintenance}
                    onChange={e => setInputIsMaintenance(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontWeight: 600, color: inputIsMaintenance ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                    เปิดใช้งานโหมดปิดปรับปรุง (Maintenance Mode)
                  </span>
                </label>

                {inputIsMaintenance && (
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      ข้อความประกาศแจ้งเจ้าหน้าที่ (Announcement Message)
                    </label>
                    <textarea
                      className="input-field"
                      rows={2}
                      value={inputMaintenanceMessage}
                      onChange={e => setInputMaintenanceMessage(e.target.value)}
                      placeholder="ระบบกำลังปิดปรับปรุงชั่วคราว..."
                      style={{ fontSize: '0.85rem', resize: 'vertical' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px', display: 'block' }}>
                      ⚠️ เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปจะไม่สามารถเข้าใช้งานหรือประเมินได้ และจะเห็นหน้าประกาศนี้ (Admin ยังคงเข้าใช้งานได้ตามปกติ)
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setInputDeadline('')} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  ยกเลิกกำหนดเวลา
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} /> บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE STAFF & PERMISSIONS MODAL */}
      {isManageStaffModalOpen && isAdmin && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '840px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={24} color="#f59e0b" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  จัดการเจ้าหน้าที่ & กำหนดสิทธิ์การประเมิน (Admin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageStaffModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleAddStaff} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: '24px'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '12px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={16} /> สร้างบัญชีเจ้าหน้าที่ใหม่
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      ชื่อเจ้าหน้าที่ *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น พี่ตั๊ก"
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      ชื่อผู้ใช้ (Username) *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น tuck"
                      value={newStaffUsername}
                      onChange={e => setNewStaffUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      รหัสผ่าน (Password)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="password123"
                      value={newStaffPassword}
                      onChange={e => setNewStaffPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      บทบาทระบบ (Role)
                    </label>
                    <select
                      className="input-field"
                      value={newStaffRole}
                      onChange={e => setNewStaffRole(e.target.value)}
                    >
                      <option value="staff">เจ้าหน้าที่ทั่วไป (Staff)</option>
                      <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={newStaffIsBehavior}
                      onChange={e => setNewStaffIsBehavior(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                    />
                    <span>ให้สิทธิ์ประเมินพฤติกรรม (ร่วมสุ่มกลุ่มหมอนวด)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#60a5fa' }}>
                    <input
                      type="checkbox"
                      checked={newStaffCanViewDashboard}
                      onChange={e => setNewStaffCanViewDashboard(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                    />
                    <span>ให้สิทธิ์เข้าดูหน้ารายงานผล Dashboard (Read-Only)</span>
                  </label>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <Plus size={18} />
                    บันทึกสร้างเจ้าหน้าที่
                  </button>
                </div>
              </form>

              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                รายชื่อเจ้าหน้าที่ในระบบ และการจัดการสิทธิ์ ({staffUsers.length} คน):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {staffUsers.map((staff) => {
                  const isEditing = editingStaffId === staff.id;
                  const isBehavior = Boolean(staff.isBehaviorEvaluator);
                  const canDashboard = Boolean(staff.canViewDashboard) || staff.role === 'admin';
                  const isStaffAdmin = staff.role === 'admin';

                  return (
                    <div
                      key={staff.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="ชื่อ"
                              value={editStaffName}
                              onChange={e => setEditStaffName(e.target.value)}
                            />
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Username"
                              value={editStaffUsername}
                              onChange={e => setEditStaffUsername(e.target.value)}
                            />
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Password"
                              value={editStaffPassword}
                              onChange={e => setEditStaffPassword(e.target.value)}
                            />
                            <select
                              className="input-field"
                              value={editStaffRole}
                              onChange={e => setEditStaffRole(e.target.value)}
                            >
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                <input
                                  type="checkbox"
                                  checked={editStaffIsBehavior}
                                  onChange={e => setEditStaffIsBehavior(e.target.checked)}
                                />
                                <span>สิทธิ์ประเมินพฤติกรรม</span>
                              </label>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#60a5fa' }}>
                                <input
                                  type="checkbox"
                                  checked={editStaffCanViewDashboard}
                                  onChange={e => setEditStaffCanViewDashboard(e.target.checked)}
                                />
                                <span>สิทธิ์ดู Dashboard</span>
                              </label>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="button" onClick={() => handleSaveStaffEdit(staff.id)} className="btn btn-primary" style={{ padding: '6px 14px' }}>
                                <Check size={16} /> บันทึก
                              </button>
                              <button type="button" onClick={() => setEditingStaffId(null)} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                                <X size={16} /> ยกเลิก
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: isStaffAdmin ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: '#fff'
                            }}>
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {staff.name}
                                {isStaffAdmin && <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Admin</span>}
                                {canDashboard && !isStaffAdmin && (
                                  <span className="badge badge-teal" style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                                    <Eye size={12} /> ดู Dashboard ได้
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                Username: <code>{staff.username}</code> | Password: <code>{staff.password}</code>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleBehaviorPermission(staff)}
                              className={`btn ${isBehavior ? 'btn-primary' : 'btn-secondary'}`}
                              style={{
                                padding: '5px 10px',
                                fontSize: '0.75rem',
                                background: isBehavior ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                                color: isBehavior ? '#a78bfa' : 'var(--text-muted)',
                                border: isBehavior ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-color)'
                              }}
                            >
                              <Award size={13} />
                              {isBehavior ? 'สิทธิ์พฤติกรรม: เปิด' : 'สิทธิ์พฤติกรรม: ปิด'}
                            </button>

                            {!isStaffAdmin && (
                              <button
                                type="button"
                                onClick={() => handleToggleDashboardPermission(staff)}
                                className={`btn ${canDashboard ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.75rem',
                                  background: canDashboard ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                                  color: canDashboard ? '#60a5fa' : 'var(--text-muted)',
                                  border: canDashboard ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)'
                                }}
                              >
                                <Eye size={13} />
                                {canDashboard ? 'สิทธิ์ Dashboard: ดูได้' : 'สิทธิ์ Dashboard: ซ่อน'}
                              </button>
                            )}

                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => startEditStaff(staff)}
                                className="btn btn-secondary"
                                style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                                title="แก้ไข"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                className="btn btn-danger"
                                style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                                title="ลบ"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'right'
            }}>
              <button
                type="button"
                onClick={() => setIsManageStaffModalOpen(false)}
                className="btn btn-secondary"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE MASSEUSES MODAL */}
      {isManageMasseuseModalOpen && isAdmin && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={22} color="#a78bfa" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  จัดการรายชื่อหมอนวด (Admin)
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsManageMasseuseModalOpen(false);
                    setIsImportExportModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileSpreadsheet size={14} />
                  นำเข้า / ส่งออก (Import/Export)
                </button>
                <button
                  type="button"
                  onClick={() => setIsManageMasseuseModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px' }}
                >
                  <X size={18} />
                </button>
              </div>

            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleAddMasseuse} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 2, minWidth: '160px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ชื่อหมอนวดใหม่ *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="เช่น พี่ฟ้า"
                    value={newMasseuseName}
                    onChange={e => setNewMasseuseName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    รหัส (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={`MN-${(masseuses.length + 1).toString().padStart(2, '0')}`}
                    value={newMasseuseCode}
                    onChange={e => setNewMasseuseCode(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px' }}>
                  <Plus size={18} />
                  เพิ่มหมอนวด
                </button>
              </form>

              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                รายชื่อหมอนวดในระบบปัจจุบัน ({masseuses.length} คน):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {masseuses.map((m, idx) => {
                  const isEditing = editingMasseuseId === m.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        gap: '10px'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            className="input-field"
                            style={{ flex: 2 }}
                            value={editMasseuseName}
                            onChange={e => setEditMasseuseName(e.target.value)}
                          />
                          <input
                            type="text"
                            className="input-field"
                            style={{ flex: 1 }}
                            value={editMasseuseCode}
                            onChange={e => setEditMasseuseCode(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveMasseuseEdit(m.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px' }}
                          >
                            <Check size={16} /> บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMasseuseId(null)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '24px' }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {m.name}
                            </span>
                            <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                              {m.code}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => startEditMasseuse(m)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              title="แก้ไขชื่อ"
                            >
                              <Edit2 size={14} /> แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMasseuse(m.id, m.name)}
                              className="btn btn-danger"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              title="ลบรายชื่อ"
                            >
                              <Trash2 size={14} /> ลบ
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'right'
            }}>
              <button
                type="button"
                onClick={() => setIsManageMasseuseModalOpen(false)}
                className="btn btn-secondary"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT / EXPORT MASSEUSES MODAL */}
      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        masseuses={masseuses}
        onSuccess={(msg) => {
          loadDashboardData();
          showNotice(msg);
        }}
      />

    </div>
  );
}

