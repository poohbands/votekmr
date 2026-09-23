// Vercel Serverless Function for Realtime Multi-Device Synchronization
let cloudDataStore = {
  customStaff: [],
  staffOverrides: {},
  customMasseuses: [],
  masseuseOverrides: {},
  evaluations: {},
  settings: { deadline: null, isLockedManually: false },
  assignments: {}
};

export default function handler(req, res) {
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

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.customStaff)) cloudDataStore.customStaff = payload.customStaff;
        if (payload.staffOverrides) cloudDataStore.staffOverrides = payload.staffOverrides;
        if (Array.isArray(payload.customMasseuses)) cloudDataStore.customMasseuses = payload.customMasseuses;
        if (payload.masseuseOverrides) cloudDataStore.masseuseOverrides = payload.masseuseOverrides;
        if (payload.evaluations) cloudDataStore.evaluations = payload.evaluations;
        if (payload.settings) cloudDataStore.settings = payload.settings;
        if (payload.assignments) cloudDataStore.assignments = payload.assignments;
        cloudDataStore.updatedAt = Date.now();
      }
    } catch (e) {
      console.error('Error parsing sync payload:', e);
    }
    return res.status(200).json({ success: true, data: cloudDataStore });
  }

  return res.status(200).json({ success: true, data: cloudDataStore });
}
