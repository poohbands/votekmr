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
  assignments: {}
};

let inMemoryStore = null;

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

  // Merge in-memory and blob data
  const base = inMemoryStore ? { ...DEFAULT_DATA, ...blobData, ...inMemoryStore } : { ...DEFAULT_DATA, ...blobData };

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
    base.evaluations = { ...(blobData.evaluations || {}), ...(inMemoryStore.evaluations || {}) };
    base.settings = { ...(blobData.settings || {}), ...(inMemoryStore.settings || {}) };
    base.assignments = { ...(blobData.assignments || {}), ...(inMemoryStore.assignments || {}) };
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

        if (payload.evaluations) {
          currentData.evaluations = { ...(currentData.evaluations || {}), ...payload.evaluations };
        }
        if (payload.settings) {
          currentData.settings = { ...(currentData.settings || {}), ...payload.settings };
        }
        if (payload.assignments) {
          currentData.assignments = { ...(currentData.assignments || {}), ...payload.assignments };
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
