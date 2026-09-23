import { put } from '@vercel/blob';

const BLOB_FILE_NAME = 'data.json';
const BLOB_URL = 'https://fklthp2bxjcwbdac.public.blob.vercel-storage.com/data.json';

const DEFAULT_DATA = {
  customStaff: [],
  staffOverrides: {},
  customMasseuses: [],
  masseuseOverrides: {},
  evaluations: {},
  settings: { deadline: null, isLockedManually: false },
  assignments: {}
};

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
    try {
      const response = await fetch(`${BLOB_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ success: true, data: { ...DEFAULT_DATA, ...data } });
      }
    } catch (e) {
      console.warn('Could not fetch from blob store:', e);
    }
    return res.status(200).json({ success: true, data: DEFAULT_DATA });
  }

  // Handle write (POST / PUT)
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      let currentData = { ...DEFAULT_DATA };
      try {
        const existingRes = await fetch(`${BLOB_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (existingRes.ok) {
          const fetched = await existingRes.json();
          currentData = { ...currentData, ...fetched };
        }
      } catch (e) {
        // Fallback to default
      }

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
