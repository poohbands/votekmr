// Data Model and Storage Utilities for Masseuse Evaluation System

export const INITIAL_STAFF_USERS = [
  {
    id: 'pop',
    name: 'พี่ป๊อป',
    role: 'admin',
    username: 'admin',
    password: 'sakura4923',
    isBehaviorEvaluator: false,
    canViewDashboard: true,
    title: 'เจ้าหน้าที่ (Admin / ผู้ดูแลระบบ)',
    avatarColor: 'from-amber-500 to-red-500'
  },
  {
    id: 'wa',
    name: 'พี่วา',
    role: 'staff',
    username: 'wa',
    password: 'password123',
    isBehaviorEvaluator: true,
    canViewDashboard: false,
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม & ความรับผิดชอบ)',
    avatarColor: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'bell',
    name: 'เบล',
    role: 'staff',
    username: 'bell',
    password: 'password123',
    isBehaviorEvaluator: true,
    canViewDashboard: false,
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม & ความรับผิดชอบ)',
    avatarColor: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'jubjang',
    name: 'จุ๊บแจง',
    role: 'staff',
    username: 'jubjang',
    password: 'password123',
    isBehaviorEvaluator: true,
    canViewDashboard: false,
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม & ความรับผิดชอบ)',
    avatarColor: 'from-purple-500 to-pink-600'
  },
  {
    id: 'wann',
    name: 'พี่วรรณ',
    role: 'staff',
    username: 'wann',
    password: 'password123',
    isBehaviorEvaluator: false,
    canViewDashboard: false,
    title: 'เจ้าหน้าที่ (ผู้ประเมินความรับผิดชอบ)',
    avatarColor: 'from-sky-500 to-blue-600'
  },
  {
    id: 'miew',
    name: 'หมิว',
    role: 'staff',
    username: 'miew',
    password: 'password123',
    isBehaviorEvaluator: false,
    canViewDashboard: false,
    title: 'เจ้าหน้าที่ (ผู้ประเมินความรับผิดชอบ)',
    avatarColor: 'from-rose-500 to-orange-500'
  }
];

export const STAFF_USERS = INITIAL_STAFF_USERS;

export const INITIAL_MASSEUSES = Array.from({ length: 30 }, (_, index) => {
  const thaiNames = [
    'พี่มะลิ', 'พี่บัว', 'พี่แก้ว', 'พี่สายฝน', 'พี่ดาว', 'พี่นก', 'พี่ใจ', 'พี่ส้ม', 'พี่ปลา', 'พี่อ้อย',
    'พี่เปิ้ล', 'พี่เจี๊ยบ', 'พี่หมู', 'พี่ตั๊ก', 'พี่แอน', 'พี่ไก่', 'พี่เล็ก', 'พี่ใหญ่', 'พี่น้อย', 'พี่ต้อย',
    'พี่กุ้ง', 'พี่ป๋อม', 'พี่นา', 'พี่ฝน', 'พี่พร', 'พี่เพ็ญ', 'พี่ภา', 'พี่รัตน์', 'พี่ศรี', 'พี่เอ๋'
  ];
  const num = (index + 1).toString().padStart(2, '0');
  return {
    id: `m_${num}`,
    code: `MN-${num}`,
    name: thaiNames[index] || `หมอนวด ${num}`,
    avatarSeed: index + 1
  };
});

// Storage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'masseuse_app_current_user',
  STAFF_USERS: 'masseuse_app_staff_users_v4',
  ASSIGNMENTS: 'masseuse_app_behavior_assignments',
  EVALUATIONS: 'masseuse_app_evaluations_v1',
  MASSEUSES: 'masseuse_app_masseuses_list_v1',
  SETTINGS: 'masseuse_app_system_settings_v1'
};

// --- System Settings & Evaluation Deadline ---

export function getSystemSettings() {
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  }
  return {
    deadline: null,
    isLockedManually: false
  };
}

export function saveSystemSettings(settings) {
  const current = getSystemSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

export function isEvaluationClosed() {
  const settings = getSystemSettings();
  if (settings.isLockedManually) return true;
  if (settings.deadline) {
    const deadlineDate = new Date(settings.deadline);
    const now = new Date();
    if (now > deadlineDate) return true;
  }
  return false;
}

// --- Staff Management Utilities ---

export function getStaffUsers() {
  const stored = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse staff users:', e);
    }
  }
  return INITIAL_STAFF_USERS;
}

export function saveStaffUsers(list) {
  localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(list));
  return list;
}

export function addStaffUser({ name, username, password, role, isBehaviorEvaluator, canViewDashboard }) {
  const currentList = getStaffUsers();
  const newStaff = {
    id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    username,
    password: password || 'password123',
    role: role || 'staff',
    isBehaviorEvaluator: Boolean(isBehaviorEvaluator),
    canViewDashboard: role === 'admin' ? true : Boolean(canViewDashboard),
    title: role === 'admin' ? 'เจ้าหน้าที่ (Admin / ผู้ดูแลระบบ)' : 'เจ้าหน้าที่',
    avatarColor: role === 'admin' ? 'from-amber-500 to-red-500' : 'from-blue-500 to-indigo-600'
  };
  const updated = [...currentList, newStaff];
  saveStaffUsers(updated);
  generateBehaviorAssignments();
  return updated;
}

export function updateStaffUser(id, updatedFields) {
  const currentList = getStaffUsers();
  const updated = currentList.map(s => {
    if (s.id === id) {
      const merged = { ...s, ...updatedFields };
      if (merged.role === 'admin') merged.canViewDashboard = true;
      merged.title = merged.role === 'admin' ? 'เจ้าหน้าที่ (Admin / ผู้ดูแลระบบ)' : 'เจ้าหน้าที่';
      return merged;
    }
    return s;
  });
  saveStaffUsers(updated);
  generateBehaviorAssignments();
  return updated;
}

export function deleteStaffUser(id) {
  const currentList = getStaffUsers();
  const updated = currentList.filter(s => s.id !== id);
  saveStaffUsers(updated);
  generateBehaviorAssignments();
  return updated;
}

// --- Masseuses Management Utilities ---

export function getMasseuses() {
  const stored = localStorage.getItem(STORAGE_KEYS.MASSEUSES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse masseuses list:', e);
    }
  }
  return INITIAL_MASSEUSES;
}

export function saveMasseuses(list) {
  localStorage.setItem(STORAGE_KEYS.MASSEUSES, JSON.stringify(list));
  return list;
}

export function addMasseuse(name, code) {
  const currentList = getMasseuses();
  const nextNum = currentList.length + 1;
  const numStr = nextNum.toString().padStart(2, '0');
  const newMasseuse = {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: code || `MN-${numStr}`,
    name: name || `หมอนวด ${numStr}`,
    avatarSeed: nextNum
  };
  const updatedList = [...currentList, newMasseuse];
  saveMasseuses(updatedList);
  generateBehaviorAssignments();
  return updatedList;
}

export function updateMasseuse(id, newName, newCode) {
  const currentList = getMasseuses();
  const updatedList = currentList.map(m => {
    if (m.id === id) {
      return { ...m, name: newName, code: newCode };
    }
    return m;
  });
  saveMasseuses(updatedList);
  return updatedList;
}

export function deleteMasseuse(id) {
  const currentList = getMasseuses();
  const updatedList = currentList.filter(m => m.id !== id);
  saveMasseuses(updatedList);
  generateBehaviorAssignments();
  return updatedList;
}

// Fisher-Yates Shuffle algorithm
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate random behavior group assignments dynamically
export function generateBehaviorAssignments() {
  const masseuses = getMasseuses().map(m => m.id);
  const shuffled = shuffleArray(masseuses);
  const staffList = getStaffUsers();
  const behaviorEvaluators = staffList.filter(s => s.isBehaviorEvaluator);

  const assignments = {};
  if (behaviorEvaluators.length === 0) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    return assignments;
  }

  const groupSize = Math.ceil(shuffled.length / behaviorEvaluators.length);

  behaviorEvaluators.forEach((evaluator, index) => {
    const start = index * groupSize;
    const end = start + groupSize;
    assignments[evaluator.id] = shuffled.slice(start, end);
  });

  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  return assignments;
}

export function getBehaviorAssignments() {
  const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse behavior assignments:', e);
    }
  }
  return generateBehaviorAssignments();
}

export function getEvaluations() {
  const stored = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse evaluations:', e);
    }
  }
  return {};
}

export function saveSingleScore(staffId, category, masseuseId, score) {
  if (isEvaluationClosed()) {
    throw new Error('ระบบปิดรับการประเมินแล้ว ไม่สามารถบันทึกคะแนนเพิ่มเติมได้');
  }
  const allEvals = getEvaluations();
  if (!allEvals[staffId]) {
    allEvals[staffId] = { behavior: {}, responsibility: {} };
  }
  if (!allEvals[staffId][category]) {
    allEvals[staffId][category] = {};
  }
  allEvals[staffId][category][masseuseId] = Number(score);
  localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(allEvals));
  return allEvals;
}

export function saveStaffEvaluations(staffId, category, scoresMap) {
  if (isEvaluationClosed()) {
    throw new Error('ระบบปิดรับการประเมินแล้ว ไม่สามารถบันทึกคะแนนเพิ่มเติมได้');
  }
  const allEvals = getEvaluations();
  if (!allEvals[staffId]) {
    allEvals[staffId] = { behavior: {}, responsibility: {} };
  }
  allEvals[staffId][category] = {
    ...allEvals[staffId][category],
    ...scoresMap
  };
  localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(allEvals));
  return allEvals;
}

// Calculate Staff Evaluation Progress Report for Admin
export function getStaffProgressReport() {
  const staffList = getStaffUsers();
  const totalMasseuses = getMasseuses().length;
  const assignments = getBehaviorAssignments();
  const evaluations = getEvaluations();

  return staffList.map(staff => {
    const userEvals = evaluations[staff.id] || { behavior: {}, responsibility: {} };
    
    const respCompleted = Object.keys(userEvals.responsibility || {}).filter(
      id => userEvals.responsibility[id] !== null && userEvals.responsibility[id] !== undefined
    ).length;
    const respTotal = totalMasseuses;
    const respPercent = respTotal > 0 ? Math.round((respCompleted / respTotal) * 100) : 0;

    let behCompleted = 0;
    let behTotal = 0;
    let behPercent = 0;
    if (staff.isBehaviorEvaluator) {
      const assignedIds = assignments[staff.id] || [];
      behTotal = assignedIds.length;
      behCompleted = assignedIds.filter(
        id => userEvals.behavior?.[id] !== null && userEvals.behavior?.[id] !== undefined
      ).length;
      behPercent = behTotal > 0 ? Math.round((behCompleted / behTotal) * 100) : 0;
    }

    const totalRequired = respTotal + behTotal;
    const totalDone = respCompleted + behCompleted;
    const overallPercent = totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0;

    return {
      staff,
      respCompleted,
      respTotal,
      respPercent,
      behCompleted,
      behTotal,
      behPercent,
      isBehaviorEvaluator: staff.isBehaviorEvaluator,
      overallPercent,
      isFullyCompleted: overallPercent === 100
    };
  });
}

// Calculate comprehensive results for Admin Dashboard
export function calculateResults() {
  const masseusesList = getMasseuses();
  const assignments = getBehaviorAssignments();
  const evaluations = getEvaluations();
  const staffList = getStaffUsers();
  const behaviorEvaluators = staffList.filter(s => s.isBehaviorEvaluator);

  const results = masseusesList.map(m => {
    let assignedStaffId = null;
    for (const evaluator of behaviorEvaluators) {
      if (assignments[evaluator.id]?.includes(m.id)) {
        assignedStaffId = evaluator.id;
        break;
      }
    }

    const assignedStaffName = staffList.find(s => s.id === assignedStaffId)?.name || '-';
    const behaviorScore = evaluations[assignedStaffId]?.behavior?.[m.id] ?? null;

    const respScoresByStaff = {};
    let respSum = 0;
    let respCount = 0;

    staffList.forEach(staff => {
      const score = evaluations[staff.id]?.responsibility?.[m.id] ?? null;
      respScoresByStaff[staff.id] = score;
      if (score !== null && score !== undefined) {
        respSum += score;
        respCount++;
      }
    });

    const avgResponsibility = respCount > 0 ? (respSum / respCount) : null;

    let totalScore = null;
    if (behaviorScore !== null && avgResponsibility !== null) {
      totalScore = (behaviorScore + avgResponsibility) / 2;
    } else if (avgResponsibility !== null) {
      totalScore = avgResponsibility;
    } else if (behaviorScore !== null) {
      totalScore = behaviorScore;
    }

    return {
      masseuse: m,
      assignedBehaviorStaffId: assignedStaffId,
      assignedBehaviorStaffName: assignedStaffName,
      behaviorScore: behaviorScore,
      respScoresByStaff: respScoresByStaff,
      respCount: respCount,
      totalRespStaff: staffList.length,
      avgResponsibility: avgResponsibility,
      totalScore: totalScore
    };
  });

  results.sort((a, b) => {
    if (a.totalScore === null && b.totalScore === null) return 0;
    if (a.totalScore === null) return 1;
    if (b.totalScore === null) return -1;
    return b.totalScore - a.totalScore;
  });

  results.forEach((item, index) => {
    item.rank = item.totalScore !== null ? index + 1 : '-';
  });

  return results;
}

// Seed Demo Random Mock Data
export function seedMockEvaluations() {
  const masseusesList = getMasseuses();
  const staffList = getStaffUsers();
  const assignments = getBehaviorAssignments();
  const mockEvals = {};

  staffList.forEach(staff => {
    mockEvals[staff.id] = { behavior: {}, responsibility: {} };

    masseusesList.forEach((m, idx) => {
      const base = 7 + Math.floor(Math.sin(idx + staff.name.length) * 2) + Math.floor(Math.random() * 2);
      const score = Math.min(10, Math.max(5, base));
      mockEvals[staff.id].responsibility[m.id] = score;
    });

    if (staff.isBehaviorEvaluator && assignments[staff.id]) {
      assignments[staff.id].forEach((mId, idx) => {
        const score = Math.min(10, Math.max(6, 8 + (idx % 3) - Math.floor(Math.random() * 2)));
        mockEvals[staff.id].behavior[mId] = score;
      });
    }
  });

  localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(mockEvals));
  return mockEvals;
}

// Clear evaluation scores only for system reset
export function resetEvaluationsOnly() {
  localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
  generateBehaviorAssignments();
}

// Clear all data
export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
  localStorage.removeItem(STORAGE_KEYS.MASSEUSES);
  localStorage.removeItem(STORAGE_KEYS.STAFF_USERS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  generateBehaviorAssignments();
}
