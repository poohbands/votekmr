// Data Model and Storage Utilities for Masseuse Evaluation System

export const BEHAVIOR_SUB_CRITERIA = [
  {
    key: 'welcome',
    code: '2.1',
    title: 'การต้อนรับ ดูแลผู้มารับบริการ ตั้งแต่เริ่ม จบเสร็จสิ้นบริการ',
    description: 'การทักทาย ไหว้ ยิ้มแย้ม การเอาใจใส่สอบถามความต้องการ และการดูแลตลอดจนเสร็จสิ้นบริการ'
  },
  {
    key: 'grooming',
    code: '2.2',
    title: 'การแต่งกาย สุภาพเรียบร้อย เหมาะสม',
    description: 'ความสะอาดของชุดยูนิฟอร์ม ทรงผม ความเรียบร้อย ถูกสุขอนามัย และความเหมาะสม'
  }
];

export const INITIAL_STAFF_USERS = [
  {
    id: 'pop',
    name: 'พี่ป๊อป',
    role: 'admin',
    username: 'admin',
    password: 'sakura4923',
    isBehaviorEvaluator: true,
    canViewDashboard: true,
    title: 'เจ้าหน้าที่ (Admin / ผู้ประเมินพฤติกรรม)',
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
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม)',
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
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม)',
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
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม)',
    avatarColor: 'from-purple-500 to-pink-600'
  },
  {
    id: 'wann',
    name: 'พี่วรรณ',
    role: 'staff',
    username: 'wan',
    aliases: ['wann'],
    password: 'password123',
    isBehaviorEvaluator: true,
    canViewDashboard: true,
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม / ดู Dashboard ได้)',
    avatarColor: 'from-sky-500 to-blue-600'
  },
  {
    id: 'miew',
    name: 'หมิว',
    role: 'staff',
    username: 'miew',
    password: 'password123',
    isBehaviorEvaluator: true,
    canViewDashboard: false,
    title: 'เจ้าหน้าที่ (ผู้ประเมินพฤติกรรม)',
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
  SETTINGS: 'masseuse_app_system_settings_v1',
  EVALUATIONS_RESET_AT: 'masseuse_app_evaluations_reset_at_v1'
};

// --- Cloud Sync Realtime Serverless Integration ---
const BLOB_FALLBACK_URL = 'https://fklthp2bxjcwbdac.public.blob.vercel-storage.com/data.json?download=1';

function getCloudApiUrl() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api/sync`;
  }
  return 'https://score-gules.vercel.app/api/sync';
}

export function mergeEvaluations(evalsA, evalsB) {
  if (!evalsA && !evalsB) return {};
  if (!evalsA) return evalsB || {};
  if (!evalsB) return evalsA || {};

  const merged = {};
  const allStaffIds = new Set([
    ...Object.keys(evalsA || {}),
    ...Object.keys(evalsB || {})
  ]);

  for (const staffId of allStaffIds) {
    const sA = evalsA[staffId] || {};
    const sB = evalsB[staffId] || {};

    merged[staffId] = {
      behavior: {},
      responsibility: {}
    };

    const behA = sA.behavior || {};
    const behB = sB.behavior || {};
    const allMasseuseIds = new Set([
      ...Object.keys(behA),
      ...Object.keys(behB)
    ]);

    for (const mId of allMasseuseIds) {
      const mA = behA[mId];
      const mB = behB[mId];

      if (mA === undefined && mB === undefined) continue;
      if (mA === undefined) {
        merged[staffId].behavior[mId] = mB;
        continue;
      }
      if (mB === undefined) {
        merged[staffId].behavior[mId] = mA;
        continue;
      }

      const objA = typeof mA === 'number' ? { welcome: mA, grooming: mA } : (typeof mA === 'object' && mA !== null ? mA : {});
      const objB = typeof mB === 'number' ? { welcome: mB, grooming: mB } : (typeof mB === 'object' && mB !== null ? mB : {});

      const subMerged = {};

      if (objA.welcome !== undefined && objB.welcome === undefined) {
        subMerged.welcome = objA.welcome;
      } else if (objB.welcome !== undefined && objA.welcome === undefined) {
        subMerged.welcome = objB.welcome;
      } else if (objA.welcome !== undefined && objB.welcome !== undefined) {
        subMerged.welcome = objB.welcome ?? objA.welcome;
      }

      if (objA.grooming !== undefined && objB.grooming === undefined) {
        subMerged.grooming = objA.grooming;
      } else if (objB.grooming !== undefined && objA.grooming === undefined) {
        subMerged.grooming = objB.grooming;
      } else if (objA.grooming !== undefined && objB.grooming !== undefined) {
        subMerged.grooming = objB.grooming ?? objA.grooming;
      }

      merged[staffId].behavior[mId] = subMerged;
    }

    const respA = sA.responsibility || {};
    const respB = sB.responsibility || {};
    merged[staffId].responsibility = { ...respA, ...respB };
  }

  return merged;
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
        const blobRes = await fetch(`${BLOB_FALLBACK_URL}&${cacheBuster}`, { cache: 'no-store' });
        if (blobRes.ok) {
          data = await blobRes.json();
        }
      } catch (be) {
        console.warn('Blob fallback notice:', be);
      }
    }

    if (data) {
      // 0. Check evaluations reset timestamp — cloud reset takes precedence
      const localResetAt = Number(localStorage.getItem(STORAGE_KEYS.EVALUATIONS_RESET_AT) || 0);
      const cloudResetAt = Number(data.evaluationsResetAt || 0);
      let wasReset = false;

      if (cloudResetAt > localResetAt) {
        localStorage.setItem(STORAGE_KEYS.EVALUATIONS_RESET_AT, cloudResetAt.toString());
        localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(data.evaluations || {}));
        wasReset = true;
        if (typeof window !== 'undefined') {
          // Use null detail to signal "reset" — UI should re-read from localStorage
          window.dispatchEvent(new CustomEvent('evaluations_synced', { detail: null }));
        }
      }

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
      // Cloud assignments are authoritative — always prefer cloud over local
      if (data.assignments && typeof data.assignments === 'object' && Object.keys(data.assignments).length > 0) {
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(data.assignments));
      }
      if (!wasReset && data.evaluations && typeof data.evaluations === 'object') {
        // Merge cloud evaluations with local evaluations (local takes precedence for same key)
        const localEvals = getEvaluations();
        const mergedEvals = mergeEvaluations(data.evaluations, localEvals);
        localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(mergedEvals));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('evaluations_synced', { detail: mergedEvals }));
        }
      }
      if (data.settings && typeof data.settings === 'object') {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
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

let isPushing = false;
let pendingPush = false;
let pendingPushOptions = {};

export async function pushToCloud(options = {}) {
  if (isPushing) {
    pendingPush = true;
    // Merge options so critical flags (resetAll, isAssignmentUpdate) are preserved
    pendingPushOptions = {
      ...pendingPushOptions,
      ...options,
      resetEvaluations: (pendingPushOptions.resetEvaluations || options.resetEvaluations) || false,
      resetAll: (pendingPushOptions.resetAll || options.resetAll) || false,
      isAssignmentUpdate: (pendingPushOptions.isAssignmentUpdate || options.isAssignmentUpdate) || false,
    };
    return false;
  }
  isPushing = true;
  try {
    const isReset = Boolean(options.resetEvaluations || options.resetAll);
    const resetAt = options.evaluationsResetAt || Number(localStorage.getItem(STORAGE_KEYS.EVALUATIONS_RESET_AT) || 0);
    const isAssignmentUpdate = Boolean(options.isAssignmentUpdate || options.resetAll);
    const payload = {
      customStaff: getCustomStaff(),
      staffOverrides: getStaffOverrides(),
      customMasseuses: getCustomMasseuses(),
      masseuseOverrides: getMasseuseOverrides(),
      evaluations: isReset ? {} : getEvaluations(),
      settings: getSystemSettings(),
      assignments: getBehaviorAssignments(),
      isAssignmentUpdate,
      resetEvaluations: isReset,
      resetAll: Boolean(options.resetAll),
      evaluationsResetAt: resetAt
    };
    const res = await fetch(getCloudApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    isPushing = false;
    if (pendingPush) {
      pendingPush = false;
      const queuedOptions = pendingPushOptions;
      pendingPushOptions = {};
      return pushToCloud(queuedOptions);
    }
    return res.ok;
  } catch (err) {
    console.warn('Cloud push warning:', err);
    isPushing = false;
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
      const parsed = JSON.parse(stored);
      return {
        deadline: parsed.deadline ?? null,
        isLockedManually: Boolean(parsed.isLockedManually),
        isMaintenanceMode: Boolean(parsed.isMaintenanceMode),
        maintenanceMessage: parsed.maintenanceMessage || 'ระบบกำลังปิดปรับปรุงชั่วคราว เพื่อบำรุงรักษาระบบและอัปเดตข้อมูล'
      };
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }
  }
  return {
    deadline: null,
    isLockedManually: false,
    isMaintenanceMode: false,
    maintenanceMessage: 'ระบบกำลังปิดปรับปรุงชั่วคราว เพื่อบำรุงรักษาระบบและอัปเดตข้อมูล'
  };
}

export function isMaintenanceActive() {
  const settings = getSystemSettings();
  return Boolean(settings.isMaintenanceMode);
}

export function saveSystemSettings(settings) {
  const current = getSystemSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  pushToCloud();
  return updated;
}

export function setMaintenanceMode(isMaintenance, message) {
  const current = getSystemSettings();
  const updated = {
    ...current,
    isMaintenanceMode: Boolean(isMaintenance),
    maintenanceMessage: message || current.maintenanceMessage
  };
  return saveSystemSettings(updated);
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
  // Only regenerate assignments if no evaluations exist yet (preserve shuffle lock rule)
  if (!hasAnyEvaluations()) {
    generateBehaviorAssignments();
    pushToCloud({ isAssignmentUpdate: true });
  }
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
  // Only regenerate assignments if no evaluations exist yet
  if (!hasAnyEvaluations()) {
    generateBehaviorAssignments();
    pushToCloud({ isAssignmentUpdate: true });
  }
  return updatedList;
}

export function deleteStaffUser(id) {
  const overrides = getStaffOverrides();
  overrides[id] = { ...(overrides[id] || {}), isDeleted: true };
  localStorage.setItem(STORAGE_KEYS.STAFF_OVERRIDES, JSON.stringify(overrides));

  const currentCustom = getCustomStaff().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_STAFF, JSON.stringify(currentCustom));

  pushToCloud();
  // Only regenerate assignments if no evaluations exist yet (preserve shuffle lock rule)
  if (!hasAnyEvaluations()) {
    generateBehaviorAssignments();
    pushToCloud({ isAssignmentUpdate: true });
  }
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
  // Only regenerate assignments if no evaluations exist yet (preserve shuffle lock rule)
  if (!hasAnyEvaluations()) {
    generateBehaviorAssignments();
    pushToCloud({ isAssignmentUpdate: true });
  }
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
  // Only regenerate assignments if no evaluations exist yet (preserve shuffle lock rule)
  if (!hasAnyEvaluations()) {
    generateBehaviorAssignments();
    pushToCloud({ isAssignmentUpdate: true });
  }
  return getMasseuses();
}

export function importMasseuses(newList, mode = 'append') {
  if (!Array.isArray(newList) || newList.length === 0) {
    throw new Error('ไม่พบข้อมูลรายชื่อหมอนวดที่จะนำเข้า');
  }

  const existingMasseuses = getMasseuses();

  if (mode === 'replace') {
    const overrides = getMasseuseOverrides();
    // Mark existing masseuses as deleted so initial base and previous custom don't persist
    existingMasseuses.forEach(m => {
      overrides[m.id] = { ...(overrides[m.id] || m), isDeleted: true };
    });
    INITIAL_MASSEUSES.forEach(m => {
      overrides[m.id] = { ...(overrides[m.id] || m), isDeleted: true };
    });

    const customList = newList.map((item, index) => {
      const num = (index + 1).toString().padStart(2, '0');
      const id = `m_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
      const code = (item.code && item.code.trim()) || `MN-${num}`;
      const name = (item.name || '').trim();
      const mObj = {
        id,
        code,
        name: name || `หมอนวด ${num}`,
        avatarSeed: index + 1
      };
      overrides[id] = mObj;
      return mObj;
    });

    localStorage.setItem(STORAGE_KEYS.CUSTOM_MASSEUSES, JSON.stringify(customList));
    localStorage.setItem(STORAGE_KEYS.MASSEUSE_OVERRIDES, JSON.stringify(overrides));
    localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
    const resetTime = Date.now();
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS_RESET_AT, resetTime.toString());

    generateBehaviorAssignments();
    // replace mode always resets evaluations so assignment update is safe
    pushToCloud({ resetEvaluations: true, evaluationsResetAt: resetTime, isAssignmentUpdate: true });
    return getMasseuses();
  } else {
    // Mode: append
    const currentCustom = getCustomMasseuses();
    const overrides = getMasseuseOverrides();
    const baseCount = existingMasseuses.length;

    const addedCustom = newList.map((item, index) => {
      const num = (baseCount + index + 1).toString().padStart(2, '0');
      const id = `m_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
      const code = (item.code && item.code.trim()) || `MN-${num}`;
      const name = (item.name || '').trim();
      const mObj = {
        id,
        code,
        name: name || `หมอนวด ${num}`,
        avatarSeed: baseCount + index + 1
      };
      overrides[id] = mObj;
      return mObj;
    });

    const updatedCustom = [...currentCustom, ...addedCustom];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MASSEUSES, JSON.stringify(updatedCustom));
    localStorage.setItem(STORAGE_KEYS.MASSEUSE_OVERRIDES, JSON.stringify(overrides));

    // Only regenerate assignments if no evaluations exist yet (preserve shuffle lock rule)
    if (!hasAnyEvaluations()) {
      generateBehaviorAssignments();
      pushToCloud({ isAssignmentUpdate: true });
    } else {
      pushToCloud();
    }
    return getMasseuses();
  }
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

// Generate behavior group assignments (30 masseuses / 6 evaluators = exactly 5 each, strictly disjoint)
export function generateBehaviorAssignments(isRandom = false) {
  const masseuseList = getMasseuses();
  const staffList = getStaffUsers();
  const behaviorEvaluators = staffList.filter(s => s.isBehaviorEvaluator);

  const assignments = {};
  if (behaviorEvaluators.length === 0 || masseuseList.length === 0) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    if (isRandom) {
      pushToCloud({ isAssignmentUpdate: true });
    }
    return assignments;
  }

  // Ensure unique masseuses
  const uniqueMasseuses = [];
  const seenIds = new Set();
  for (const m of masseuseList) {
    if (m && m.id && !seenIds.has(m.id)) {
      seenIds.add(m.id);
      uniqueMasseuses.push(m);
    }
  }

  let orderedIds;
  if (isRandom) {
    orderedIds = shuffleArray(uniqueMasseuses.map(m => m.id));
  } else {
    // Sort deterministically by code (MN-01, MN-02, ...)
    const sorted = [...uniqueMasseuses].sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
    orderedIds = sorted.map(m => m.id);
  }

  // Divide into groups of 5 masseuses per evaluator (e.g. 30 masseuses / 6 evaluators = 5 each)
  const groupSize = Math.max(1, Math.floor(orderedIds.length / behaviorEvaluators.length));

  behaviorEvaluators.forEach((evaluator, index) => {
    const start = index * groupSize;
    const end = index === behaviorEvaluators.length - 1 ? orderedIds.length : start + groupSize;
    assignments[evaluator.id] = orderedIds.slice(start, end);
  });

  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  if (isRandom) {
    pushToCloud({ isAssignmentUpdate: true });
  }
  return assignments;
}

export function getBehaviorAssignments() {
  const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
        // Validate that assignments are strictly disjoint with zero overlap
        const seen = new Set();
        let hasOverlap = false;
        for (const ids of Object.values(parsed)) {
          if (Array.isArray(ids)) {
            for (const id of ids) {
              if (seen.has(id)) {
                hasOverlap = true;
                break;
              }
              seen.add(id);
            }
          }
          if (hasOverlap) break;
        }
        if (!hasOverlap && seen.size > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse behavior assignments:', e);
    }
  }
  return generateBehaviorAssignments(false);
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

// Check whether any evaluations have already been started/given
export function hasAnyEvaluations() {
  const allEvals = getEvaluations();
  if (!allEvals || typeof allEvals !== 'object') return false;

  for (const staffId of Object.keys(allEvals)) {
    const staffEvals = allEvals[staffId];
    if (!staffEvals) continue;
    const beh = staffEvals.behavior;
    if (beh && typeof beh === 'object') {
      for (const mId of Object.keys(beh)) {
        const val = beh[mId];
        if (val !== null && val !== undefined) {
          if (typeof val === 'number') return true;
          if (typeof val === 'object' && (val.welcome !== undefined || val.grooming !== undefined)) {
            return true;
          }
        }
      }
    }
    const resp = staffEvals.responsibility;
    if (resp && typeof resp === 'object' && Object.keys(resp).length > 0) {
      return true;
    }
  }
  return false;
}

export function saveBehaviorSubScore(staffId, masseuseId, subKey, score) {
  if (isEvaluationClosed()) {
    throw new Error('ระบบปิดรับการประเมินแล้ว ไม่สามารถบันทึกคะแนนเพิ่มเติมได้');
  }

  // Enforce: Masseuse can only be evaluated by their assigned evaluator!
  const assignments = getBehaviorAssignments();
  const assignedToStaff = assignments[staffId] || [];
  if (!assignedToStaff.includes(masseuseId)) {
    throw new Error('หมอนวดท่านนี้ไม่ได้อยู่ในกลุ่มที่คุณได้รับมอบหมาย (หมอนวด 1 คนจะถูกประเมินได้โดยผู้ประเมินที่รับผิดชอบคนเดียวเท่านั้น)');
  }

  const allEvals = getEvaluations();
  if (!allEvals[staffId]) {
    allEvals[staffId] = { behavior: {}, responsibility: {} };
  }
  if (!allEvals[staffId].behavior) {
    allEvals[staffId].behavior = {};
  }
  const current = allEvals[staffId].behavior[masseuseId];
  let subObj = {};
  if (typeof current === 'object' && current !== null) {
    subObj = { ...current };
  } else if (typeof current === 'number') {
    subObj = { welcome: current, grooming: current };
  }
  subObj[subKey] = Number(score);
  allEvals[staffId].behavior[masseuseId] = subObj;

  localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(allEvals));
  pushToCloud();
  return allEvals;
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

// Calculate Staff Evaluation Progress Report for Admin (Behavior Evaluation)
// Rule: Exactly 1 assigned group per evaluator, strictly disjoint
export function getStaffProgressReport() {
  const staffList = getStaffUsers();
  const assignments = getBehaviorAssignments();
  const evaluations = getEvaluations();

  return staffList.map(staff => {
    const userEvals = evaluations[staff.id]?.behavior || {};
    const assignedIds = assignments[staff.id] || [];
    const behTotal = assignedIds.length;

    // Completed if both 2.1 (welcome) and 2.2 (grooming) are evaluated
    const behCompleted = assignedIds.filter(id => {
      const score = userEvals[id];
      if (score === null || score === undefined) return false;
      if (typeof score === 'number') return true;
      return score.welcome !== undefined && score.grooming !== undefined;
    }).length;

    const behPercent = behTotal > 0 ? Math.round((behCompleted / behTotal) * 100) : 0;

    return {
      staff,
      behCompleted,
      behTotal,
      behPercent,
      isBehaviorEvaluator: staff.isBehaviorEvaluator,
      overallPercent: behPercent,
      isFullyCompleted: behTotal > 0 && behCompleted === behTotal
    };
  });
}

// Calculate comprehensive results for Admin Dashboard (Behavior-Only Evaluation)
// Rule: Each masseuse belongs to exactly 1 group, and can be evaluated by 1 evaluator only.
export function calculateResults() {
  const masseusesList = getMasseuses();
  const assignments = getBehaviorAssignments();
  const evaluations = getEvaluations();
  const staffList = getStaffUsers();
  const behaviorEvaluators = staffList.filter(s => s.isBehaviorEvaluator);

  const results = masseusesList.map(m => {
    // 1. Find the single evaluator assigned to this masseuse
    let assignedStaffId = null;
    for (const evaluator of behaviorEvaluators) {
      if (assignments[evaluator.id]?.includes(m.id)) {
        assignedStaffId = evaluator.id;
        break;
      }
    }

    const assignedStaffName = staffList.find(s => s.id === assignedStaffId)?.name || '-';

    // 2. Score comes ONLY from the assigned evaluator
    const rawEval = (assignedStaffId && evaluations[assignedStaffId]?.behavior?.[m.id]) ?? null;

    let welcomeScore = null;
    let groomingScore = null;
    let behaviorScore = null;

    if (rawEval !== null && rawEval !== undefined) {
      if (typeof rawEval === 'number') {
        welcomeScore = rawEval;
        groomingScore = rawEval;
        behaviorScore = rawEval;
      } else if (typeof rawEval === 'object') {
        welcomeScore = rawEval.welcome ?? null;
        groomingScore = rawEval.grooming ?? null;
        if (welcomeScore !== null && groomingScore !== null) {
          behaviorScore = Math.round(((welcomeScore + groomingScore) / 2) * 10) / 10;
        } else if (welcomeScore !== null) {
          behaviorScore = welcomeScore;
        } else if (groomingScore !== null) {
          behaviorScore = groomingScore;
        }
      }
    }

    const totalScore = behaviorScore;

    return {
      masseuse: m,
      assignedBehaviorStaffId: assignedStaffId,
      assignedBehaviorStaffName: assignedStaffName,
      welcomeScore,
      groomingScore,
      behaviorScore,
      totalScore
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
  const staffList = getStaffUsers();
  const assignments = getBehaviorAssignments();
  const mockEvals = {};

  staffList.forEach(staff => {
    mockEvals[staff.id] = { behavior: {}, responsibility: {} };

    if (staff.isBehaviorEvaluator && assignments[staff.id]) {
      assignments[staff.id].forEach((mId, idx) => {
        const welcome = Math.min(10, Math.max(6, 8 + (idx % 3) - Math.floor(Math.random() * 2)));
        const grooming = Math.min(10, Math.max(7, 9 - (idx % 2) - Math.floor(Math.random() * 2)));
        mockEvals[staff.id].behavior[mId] = {
          welcome,
          grooming
        };
      });
    }
  });

  localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(mockEvals));
  pushToCloud();
  return mockEvals;
}

// Clear evaluation scores only for system reset
export async function resetEvaluationsOnly() {
  const resetTime = Date.now();
  localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify({}));
  localStorage.setItem(STORAGE_KEYS.EVALUATIONS_RESET_AT, resetTime.toString());

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('evaluations_synced', { detail: {} }));
  }

  return await pushToCloud({
    resetEvaluations: true,
    evaluationsResetAt: resetTime
  });
}

// Clear all data
export async function resetAllData() {
  const resetTime = Date.now();
  localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_MASSEUSES);
  localStorage.removeItem(STORAGE_KEYS.MASSEUSE_OVERRIDES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_STAFF);
  localStorage.removeItem(STORAGE_KEYS.STAFF_OVERRIDES);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  localStorage.setItem(STORAGE_KEYS.EVALUATIONS_RESET_AT, resetTime.toString());

  generateBehaviorAssignments();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('evaluations_synced', { detail: {} }));
  }

  return await pushToCloud({
    resetAll: true,
    resetEvaluations: true,
    evaluationsResetAt: resetTime
  });
}
