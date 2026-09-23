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
    username: 'wan',
    aliases: ['wann'],
    password: 'password123',
    isBehaviorEvaluator: false,
    canViewDashboard: true,
    title: 'เจ้าหน้าที่ (ดู Dashboard ได้)',
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
  CUSTOM_STAFF: 'masseuse_app_custom_staff_v1',
  STAFF_OVERRIDES: 'masseuse_app_staff_overrides_v1',
  CUSTOM_MASSEUSES: 'masseuse_app_custom_masseuses_v1',
  MASSEUSE_OVERRIDES: 'masseuse_app_masseuse_overrides_v1',
  ASSIGNMENTS: 'masseuse_app_behavior_assignments',
  EVALUATIONS: 'masseuse_app_evaluations_v1',
  SETTINGS: 'masseuse_app_system_settings_v1'
};

// --- Cloud Sync Realtime Serverless Integration ---
const BLOB_FALLBACK_URL = 'https://fklthp2bxjcwbdac.public.blob.vercel-storage.com/data.json';

function getCloudApiUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api/sync`;
  }
  return 'https://score-gules.vercel.app/api/sync';
}

let isPullingCloud = false;

export async function pullFromCloud() {
  if (isPullingCloud) return false;
  isPullingCloud = true;
  try {
    let data = null;
    const cacheBuster = `t=${Date.now()}`;

    // 1. Try Vercel Serverless Function
    try {
      const res = await fetch(`${getCloudApiUrl()}?${cacheBuster}`, { cache: 'no-store' });
      if (res.ok) {
        const result = await res.json();
        if (result && result.data) {
          data = result.data;
        }
      }
    } catch (e) {
      console.warn('API sync endpoint notice:', e);
    }

    // 2. Direct Blob Store Fallback if API was unavailable
    if (!data) {
      try {
        const blobRes = await fetch(`${BLOB_FALLBACK_URL}?${cacheBuster}`, { cache: 'no-store' });
        if (blobRes.ok) {
          data = await blobRes.json();
        }
      } catch (be) {
        console.warn('Blob fallback notice:', be);
      }
    }

    if (data) {
      // Smart union merge for custom staff so local staff is never lost
      if (Array.isArray(data.customStaff)) {
        const localCustom = getCustomStaff();
        const staffMap = new Map();
        localCustom.forEach(s => { if (s && s.id) staffMap.set(s.id, s); });
        data.customStaff.forEach(s => { if (s && s.id) staffMap.set(s.id, s); });
        const mergedCustom = Array.from(staffMap.values());
        localStorage.setItem(STORAGE_KEYS.CUSTOM_STAFF, JSON.stringify(mergedCustom));
      }
      if (data.staffOverrides && typeof data.staffOverrides === 'object') {
        const localOverrides = getStaffOverrides();
        const mergedOverrides = { ...localOverrides, ...data.staffOverrides };
        localStorage.setItem(STORAGE_KEYS.STAFF_OVERRIDES, JSON.stringify(mergedOverrides));
      }
      if (Array.isArray(data.customMasseuses)) {
        const localMasseuses = getCustomMasseuses();
        const mmap = new Map();
        localMasseuses.forEach(m => { if (m && m.id) mmap.set(m.id, m); });
        data.customMasseuses.forEach(m => { if (m && m.id) mmap.set(m.id, m); });
        localStorage.setItem(STORAGE_KEYS.CUSTOM_MASSEUSES, JSON.stringify(Array.from(mmap.values())));
      }
      if (data.masseuseOverrides && typeof data.masseuseOverrides === 'object') {
        const localMasseuseOverrides = getMasseuseOverrides();
        localStorage.setItem(STORAGE_KEYS.MASSEUSE_OVERRIDES, JSON.stringify({ ...localMasseuseOverrides, ...data.masseuseOverrides }));
      }
      if (data.evaluations && typeof data.evaluations === 'object') {
        const localEvals = getEvaluations();
        localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify({ ...localEvals, ...data.evaluations }));
      }
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (data.assignments && typeof data.assignments === 'object') {
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
      }
      isPullingCloud = false;
      return true;
    }
  } catch (err) {
    console.warn('Cloud pull warning:', err);
  }
  isPullingCloud = false;
  return false;
}

export async function pushToCloud() {
  try {
    const payload = {
      customStaff: getCustomStaff(),
      staffOverrides: getStaffOverrides(),
      customMasseuses: getCustomMasseuses(),
      masseuseOverrides: getMasseuseOverrides(),
      evaluations: getEvaluations(),
      settings: getSystemSettings(),
      assignments: getBehaviorAssignments()
    };
    const res = await fetch(getCloudApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud push warning:', err);
    return false;
  }
}

// --- Internal Helper Getters/Setters ---

function getCustomStaff() {
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_STAFF);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

function getStaffOverrides() {
  const stored = localStorage.getItem(STORAGE_KEYS.STAFF_OVERRIDES);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return {};
}

function getCustomMasseuses() {
  const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_MASSEUSES);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return [];
}

function getMasseuseOverrides() {
  const stored = localStorage.getItem(STORAGE_KEYS.MASSEUSE_OVERRIDES);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return {};
}

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
  pushToCloud();
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
  const customStaff = getCustomStaff();
  const staffOverrides = getStaffOverrides();

  // Merge INITIAL_STAFF_USERS with overrides
  const baseStaff = INITIAL_STAFF_USERS.map(s => {
    if (staffOverrides[s.id]) {
      return { ...s, ...staffOverrides[s.id] };
    }
    return s;
  });

  // Filter out deleted base staff if deleted in overrides
  const activeBaseStaff = baseStaff.filter(s => !staffOverrides[s.id]?.isDeleted);

  // Merge custom staff with overrides
  const activeCustomStaff = customStaff.map(s => {
    if (staffOverrides[s.id]) {
      return { ...s, ...staffOverrides[s.id] };
    }
    return s;
  }).filter(s => !s.isDeleted);

  return [...activeBaseStaff, ...activeCustomStaff];
}

export function saveStaffUsers(list) {
  const initialIds = new Set(INITIAL_STAFF_USERS.map(s => s.id));
  const customStaff = list.filter(s => !initialIds.has(s.id));
  
  const overrides = {};
  list.forEach(s => {
    overrides[s.id] = s;
  });

  localStorage.setItem(STORAGE_KEYS.CUSTOM_STAFF, JSON.stringify(customStaff));
  localStorage.setItem(STORAGE_KEYS.STAFF_OVERRIDES, JSON.stringify(overrides));
  pushToCloud();
  return list;
}

export function addStaffUser({ name, username, password, role, isBehaviorEvaluator, canViewDashboard }) {
  const currentCustom = getCustomStaff();
  const newStaff = {
    id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    username: username.trim().toLowerCase(),
    password: password || 'password123',
    role: role || 'staff',
    isBehaviorEvaluator: Boolean(isBehaviorEvaluator),
    canViewDashboard: role === 'admin' ? true : Boolean(canViewDashboard),
    title: role === 'admin' ? 'เจ้าหน้าที่ (Admin / ผู้ดูแลระบบ)' : 'เจ้าหน้าที่',
    avatarColor: role === 'admin' ? 'from-amber-500 to-red-500' : 'from-blue-500 to-indigo-600'
  };

  const updatedCustom = [...currentCustom, newStaff];
  localStorage.setItem(STORAGE_KEYS.CUSTOM_STAFF, JSON.stringify(updatedCustom));
  
  const overrides = getStaffOverrides();
  overrides[newStaff.id] = newStaff;
  localStorage.setItem(STORAGE_KEYS.STAFF_OVERRIDES, JSON.stringify(overrides));

  pushToCloud();
  generateBehaviorAssignments();
  return getStaffUsers();
}

export function updateStaffUser(id, updatedFields) {
  const allStaff = getStaffUsers();
  const updatedList = allStaff.map(s => {
    if (s.id === id) {
      const merged = { ...s, ...updatedFields };
      if (merged.role === 'admin') merged.canViewDashboard = true;
      merged.title = merged.role === 'admin' ? 'เจ้าหน้าที่ (Admin / ผู้ดูแลระบบ)' : 'เจ้าหน้าที่';
      return merged;
    }
    return s;
  });

  saveStaffUsers(updatedList);
  generateBehaviorAssignments();
  return updatedList;
}

export function deleteStaffUser(id) {
  const overrides = getStaffOverrides();
  overrides[id] = { ...(overrides[id] || {}), isDeleted: true };
  localStorage.setItem(STORAGE_KEYS.STAFF_OVERRIDES, JSON.stringify(overrides));

  const currentCustom = getCustomStaff().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_STAFF, JSON.stringify(currentCustom));

  pushToCloud();
  generateBehaviorAssignments();
  return getStaffUsers();
}

// --- Masseuses Management Utilities ---

export function getMasseuses() {
  const customMasseuses = getCustomMasseuses();
  const masseuseOverrides = getMasseuseOverrides();

  const baseMasseuses = INITIAL_MASSEUSES.map(m => {
    if (masseuseOverrides[m.id]) {
      return { ...m, ...masseuseOverrides[m.id] };
    }
    return m;
  }).filter(m => !m.isDeleted);

  const activeCustom = customMasseuses.map(m => {
    if (masseuseOverrides[m.id]) {
      return { ...m, ...masseuseOverrides[m.id] };
    }
    return m;
  }).filter(m => !m.isDeleted);

  return [...baseMasseuses, ...activeCustom];
}

export function saveMasseuses(list) {
  const initialIds = new Set(INITIAL_MASSEUSES.map(m => m.id));
  const customMasseuses = list.filter(m => !initialIds.has(m.id));

  const overrides = {};
  list.forEach(m => {
    overrides[m.id] = m;
  });

  localStorage.setItem(STORAGE_KEYS.CUSTOM_MASSEUSES, JSON.stringify(customMasseuses));
  localStorage.setItem(STORAGE_KEYS.MASSEUSE_OVERRIDES, JSON.stringify(overrides));
  pushToCloud();
  return list;
}

export function addMasseuse(name, code) {
  const currentCustom = getCustomMasseuses();
  const allCurrent = getMasseuses();
  const nextNum = allCurrent.length + 1;
  const numStr = nextNum.toString().padStart(2, '0');
  
  const newMasseuse = {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: code || `MN-${numStr}`,
    name: name || `หมอนวด ${numStr}`,
    avatarSeed: nextNum
  };

  const updatedCustom = [...currentCustom, newMasseuse];
  localStorage.setItem(STORAGE_KEYS.CUSTOM_MASSEUSES, JSON.stringify(updatedCustom));
  
  const overrides = getMasseuseOverrides();
  overrides[newMasseuse.id] = newMasseuse;
  localStorage.setItem(STORAGE_KEYS.MASSEUSE_OVERRIDES, JSON.stringify(overrides));

  pushToCloud();
  generateBehaviorAssignments();
  return getMasseuses();
}

export function updateMasseuse(id, newName, newCode) {
  const allCurrent = getMasseuses();
  const updatedList = allCurrent.map(m => {
    if (m.id === id) {
      return { ...m, name: newName, code: newCode };
    }
    return m;
  });
  saveMasseuses(updatedList);
  return updatedList;
}

export function deleteMasseuse(id) {
  const overrides = getMasseuseOverrides();
  overrides[id] = { ...(overrides[id] || {}), isDeleted: true };
  localStorage.setItem(STORAGE_KEYS.MASSEUSE_OVERRIDES, JSON.stringify(overrides));

  const currentCustom = getCustomMasseuses().filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_MASSEUSES, JSON.stringify(currentCustom));

  pushToCloud();
  generateBehaviorAssignments();
  return getMasseuses();
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
    pushToCloud();
    return assignments;
  }

  const groupSize = Math.ceil(shuffled.length / behaviorEvaluators.length);

  behaviorEvaluators.forEach((evaluator, index) => {
    const start = index * groupSize;
    const end = start + groupSize;
    assignments[evaluator.id] = shuffled.slice(start, end);
  });

  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  pushToCloud();
  return assignments;
}

export function getBehaviorAssignments() {
  const stored = localStorage.setItem ? localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) : null;
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
  pushToCloud();
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
  pushToCloud();
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
  pushToCloud();
  return mockEvals;
}

// Clear evaluation scores only for system reset
export function resetEvaluationsOnly() {
  localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
  generateBehaviorAssignments();
  pushToCloud();
}

// Clear all data
export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_MASSEUSES);
  localStorage.removeItem(STORAGE_KEYS.MASSEUSE_OVERRIDES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_STAFF);
  localStorage.removeItem(STORAGE_KEYS.STAFF_OVERRIDES);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  generateBehaviorAssignments();
  pushToCloud();
}
