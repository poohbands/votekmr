import { put } from '@vercel/blob';

const BLOB_FILE_NAME = 'data.json';
const BLOB_URL = 'https://fklthp2bxjcwbdac.public.blob.vercel-storage.com/data.json?download=1';

const DEFAULT_DATA = {
  customStaff: [],
  staffOverrides: {},
  customMasseuses: [],
  masseuseOverrides: {},
  evaluations: {},
  settings: { deadline: null, isLockedManually: false },
  assignments: {},
  evaluationsResetAt: 0
};

let inMemoryStore = null;

function mergeEvaluations(evalsA, evalsB) {
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

async function loadLatestData() {
  let blobData = null;
  try {
    const res = await fetch(`${BLOB_URL}&t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      blobData = await res.json();
    }
  } catch (err) {
    console.warn('Blob read warning:', err);
  }

  const blobReset = Number(blobData?.evaluationsResetAt || 0);
  const memReset = Number(inMemoryStore?.evaluationsResetAt || 0);
  const maxReset = Math.max(blobReset, memReset);

  // Merge in-memory and blob data
  const base = inMemoryStore ? { ...DEFAULT_DATA, ...blobData, ...inMemoryStore } : { ...DEFAULT_DATA, ...blobData };
  base.evaluationsResetAt = maxReset;

  // Re-merge arrays cleanly
  if (blobData && inMemoryStore) {
    const staffMap = new Map();
    (blobData.customStaff || []).forEach(s => { if (s && s.id) staffMap.set(s.id, s); });
    (inMemoryStore.customStaff || []).forEach(s => { if (s && s.id) staffMap.set(s.id, s); });
    base.customStaff = Array.from(staffMap.values());

    const masseuseMap = new Map();
    (blobData.customMasseuses || []).forEach(m => { if (m && m.id) masseuseMap.set(m.id, m); });
    (inMemoryStore.customMasseuses || []).forEach(m => { if (m && m.id) masseuseMap.set(m.id, m); });
    base.customMasseuses = Array.from(masseuseMap.values());

    base.staffOverrides = { ...(blobData.staffOverrides || {}), ...(inMemoryStore.staffOverrides || {}) };
    base.masseuseOverrides = { ...(blobData.masseuseOverrides || {}), ...(inMemoryStore.masseuseOverrides || {}) };

    if (blobReset > memReset) {
      base.evaluations = blobData.evaluations || {};
    } else if (memReset > blobReset) {
      base.evaluations = inMemoryStore.evaluations || {};
    } else {
      base.evaluations = mergeEvaluations(blobData.evaluations, inMemoryStore.evaluations);
    }

    base.settings = { ...(blobData.settings || {}), ...(inMemoryStore.settings || {}) };
    // Blob (persistent storage) is authoritative for assignments — do not let transient in-memory override it
    base.assignments = Object.keys(blobData.assignments || {}).length > 0
      ? blobData.assignments
      : (inMemoryStore.assignments || {});
  }

  inMemoryStore = base;
  return base;
}


export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle read (GET)
  if (req.method === 'GET') {
    const current = await loadLatestData();
    return res.status(200).json({ success: true, data: current });
  }

  // Handle write (POST / PUT)
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const currentData = await loadLatestData();

      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && typeof payload === 'object') {
        if (payload.staffOverrides) {
          currentData.staffOverrides = { ...(currentData.staffOverrides || {}), ...payload.staffOverrides };
        }
        if (Array.isArray(payload.customStaff)) {
          const staffMap = new Map();
          (currentData.customStaff || []).forEach(s => { if (s && s.id) staffMap.set(s.id, s); });
          payload.customStaff.forEach(s => { if (s && s.id) staffMap.set(s.id, s); });
          currentData.customStaff = Array.from(staffMap.values());
        }
        // Filter out any custom staff that has been marked deleted
        currentData.customStaff = (currentData.customStaff || []).filter(
          s => !currentData.staffOverrides?.[s.id]?.isDeleted
        );

        if (payload.masseuseOverrides) {
          currentData.masseuseOverrides = { ...(currentData.masseuseOverrides || {}), ...payload.masseuseOverrides };
        }
        if (Array.isArray(payload.customMasseuses)) {
          const mmap = new Map();
          (currentData.customMasseuses || []).forEach(m => { if (m && m.id) mmap.set(m.id, m); });
          payload.customMasseuses.forEach(m => { if (m && m.id) mmap.set(m.id, m); });
          currentData.customMasseuses = Array.from(mmap.values());
        }
        // Filter out any custom masseuses that have been marked deleted
        currentData.customMasseuses = (currentData.customMasseuses || []).filter(
          m => !currentData.masseuseOverrides?.[m.id]?.isDeleted
        );

        if (payload.resetAll) {
          const resetTime = payload.evaluationsResetAt || Date.now();
          currentData.evaluations = {};
          currentData.evaluationsResetAt = resetTime;
          currentData.customStaff = [];
          currentData.staffOverrides = {};
          currentData.customMasseuses = [];
          currentData.masseuseOverrides = {};
          currentData.assignments = {};
          currentData.settings = { deadline: null, isLockedManually: false };
        } else if (payload.resetEvaluations) {
          const resetTime = payload.evaluationsResetAt || Date.now();
          currentData.evaluations = {};
          currentData.evaluationsResetAt = resetTime;
        } else if (payload.evaluations && typeof payload.evaluations === 'object') {
          if (payload.overwriteEvaluations) {
            currentData.evaluations = payload.evaluations;
          } else {
            currentData.evaluations = mergeEvaluations(currentData.evaluations, payload.evaluations);
          }
          if (payload.evaluationsResetAt && payload.evaluationsResetAt > (currentData.evaluationsResetAt || 0)) {
            currentData.evaluationsResetAt = payload.evaluationsResetAt;
          }
        }

        if (payload.settings && !payload.resetAll) {
          currentData.settings = { ...(currentData.settings || {}), ...payload.settings };
        }
        if (payload.assignments && (payload.isAssignmentUpdate || payload.resetAll)) {
          currentData.assignments = payload.assignments;
        }
        currentData.updatedAt = Date.now();

        // Update in-memory store immediately
        inMemoryStore = currentData;

        // Persist to Vercel Blob store
        await put(BLOB_FILE_NAME, JSON.stringify(currentData), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: 'application/json',
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        return res.status(200).json({ success: true, data: currentData });
      }
    } catch (e) {
      console.error('Error handling sync update:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(200).json({ success: true, data: DEFAULT_DATA });
}
