import React, { useState, useId } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
  FileUp,
  FileDown,
  Users
} from 'lucide-react';
import { importMasseuses } from '../data/mockData';

export default function ImportExportModal({
  isOpen,
  onClose,
  masseuses = [],
  onSuccess
}) {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [inputMethod, setInputMethod] = useState('paste'); // 'file' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [parsedList, setParsedList] = useState([]);
  const [parseError, setParseError] = useState('');
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'append'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedType, setCopiedType] = useState(null); // 'names' | 'codes_names' | null
  const fileInputId = useId();

  if (!isOpen) return null;


  // Parse raw text (CSV, Tab-separated, or Line-by-Line)
  const parseRawText = (text) => {
    if (!text || !text.trim()) {
      setParsedList([]);
      setParseError('');
      return;
    }

    try {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setParsedList([]);
        setParseError('');
        return;
      }

      const results = [];
      let startIdx = 0;

      // Check if first line is a header like "รหัส,ชื่อ" or "code,name"
      const firstLineLower = lines[0].toLowerCase();
      if (
        firstLineLower.includes('รหัส') ||
        firstLineLower.includes('ชื่อ') ||
        firstLineLower.includes('code') ||
        firstLineLower.includes('name')
      ) {
        startIdx = 1;
      }

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Try comma, semicolon, tab or pipe separation
        let parts = [];
        if (line.includes(',')) {
          parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        } else if (line.includes('\t')) {
          parts = line.split('\t').map(p => p.trim());
        } else if (line.includes(';')) {
          parts = line.split(';').map(p => p.trim());
        } else if (line.includes('|')) {
          parts = line.split('|').map(p => p.trim());
        } else {
          // Check if space separated with code pattern like "MN-01 พี่มะลิ"
          const match = line.match(/^([A-Za-z0-9_-]+)\s+(.+)$/);
          if (match) {
            parts = [match[1], match[2]];
          } else {
            // Just name alone
            parts = [line];
          }
        }

        if (parts.length >= 2) {
          const codeCandidate = parts[0].trim();
          const nameCandidate = parts.slice(1).join(' ').trim();
          results.push({
            code: codeCandidate,
            name: nameCandidate
          });
        } else if (parts.length === 1 && parts[0]) {
          results.push({
            code: '',
            name: parts[0]
          });
        }
      }

      if (results.length === 0) {
        setParseError('ไม่พบข้อมูลรายชื่อในข้อความที่ระบุ');
        setParsedList([]);
      } else {
        setParseError('');
        setParsedList(results);
      }
    } catch (err) {
      setParseError(`เกิดข้อผิดพลาดในการอ่านข้อมูล: ${err.message}`);
      setParsedList([]);
    }
  };

  const handleTextChange = (e) => {
    const txt = e.target.value;
    setPasteText(txt);
    parseRawText(txt);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        if (file.name.endsWith('.json')) {
          try {
            const parsedJson = JSON.parse(content);
            let items = [];
            if (Array.isArray(parsedJson)) {
              items = parsedJson.map((item, idx) => {
                if (typeof item === 'string') return { code: '', name: item };
                return {
                  code: item.code || item.id || '',
                  name: item.name || item.title || `หมอนวด ${idx + 1}`
                };
              });
            } else if (typeof parsedJson === 'object' && parsedJson !== null) {
              const listKey = Object.keys(parsedJson).find(k => Array.isArray(parsedJson[k]));
              if (listKey) {
                items = parsedJson[listKey].map(item => ({
                  code: item.code || '',
                  name: item.name || ''
                }));
              }
            }
            if (items.length > 0) {
              setParsedList(items);
              setParseError('');
            } else {
              setParseError('โครงสร้างไฟล์ JSON ไม่ถูกต้องหรือไม่พบรายการ');
            }
          } catch (err) {
            setParseError(`ไฟล์ JSON ผิดรูปแบบ: ${err.message}`);
          }
        } else {
          // CSV or TXT
          setPasteText(content);
          parseRawText(content);
        }
      }
    };
    reader.onerror = () => {
      setParseError('เกิดข้อผิดพลาดในการอ่านไฟล์');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDownloadTemplate = () => {
    let csv = '\uFEFFรหัส,ชื่อหมอนวด\n';
    csv += 'MN-01,พี่มะลิ\n';
    csv += 'MN-02,พี่บัว\n';
    csv += 'MN-03,พี่แก้ว\n';
    csv += 'MN-04,พี่สายฝน\n';
    csv += 'MN-05,พี่ดาว\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_masseuses.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csv = '\uFEFFรหัส,ชื่อหมอนวด\n';
    masseuses.forEach((m, idx) => {
      const code = m.code || `MN-${(idx + 1).toString().padStart(2, '0')}`;
      csv += `"${code}","${m.name}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `masseuse_names_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = masseuses.map((m, idx) => ({
      code: m.code || `MN-${(idx + 1).toString().padStart(2, '0')}`,
      name: m.name
    }));

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `masseuse_names_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = (type) => {
    let text = '';
    if (type === 'names') {
      text = masseuses.map(m => m.name).join('\n');
    } else {
      text = masseuses.map((m, idx) => {
        const code = m.code || `MN-${(idx + 1).toString().padStart(2, '0')}`;
        return `${code}\t${m.name}`;
      }).join('\n');
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  const handleConfirmImport = () => {
    if (parsedList.length === 0) return;

    if (importMode === 'replace') {
      const confirmed = window.confirm(
        `⚠️ ยืนยันการแทนที่รายชื่อทั้งหมด:\n\nระบบจะล้างรายชื่อหมอนวดเดิมทั้งหมด และแทนที่ด้วย ${parsedList.length} รายชื่อใหม่นี้\n(คะแนนประเมินเดิมจะถูกรีเซ็ต และสุ่มแบ่งกลุ่มผู้ประเมินใหม่ให้โดยอัตโนมัติ)\n\nคุณต้องการดำเนินการต่อใช่หรือไม่?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      importMasseuses(parsedList, importMode);
      if (onSuccess) {
        onSuccess(
          importMode === 'replace'
            ? `นำเข้ารายชื่อหมอนวดสำเร็จ! แทนที่ด้วยรายชื่อใหม่ ${parsedList.length} คนเรียบร้อยแล้ว`
            : `เพิ่มรายชื่อหมอนวดใหม่ ${parsedList.length} คนต่อท้ายเรียบร้อยแล้ว`
        );
      }
      onClose();
    } catch (err) {
      alert(`เกิดข้อผิดพลาดในการนำเข้า: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1100,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '780px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        borderRadius: 'var(--radius-xl)'
      }}>

        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                นำเข้าและส่งออกรายชื่อหมอนวด
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                รองรับไฟล์ CSV, TXT, JSON และการคัดลอก-วางรายชื่อจาก Excel / LINE
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher (Import / Export) */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '0 24px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'import' ? 'var(--accent-teal)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'import' ? '3px solid var(--accent-teal)' : '3px solid transparent',
              fontWeight: activeTab === 'import' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-fast)'
            }}
          >
            <FileUp size={18} />
            นำเข้ารายชื่อ (Import)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            style={{
              padding: '14px 20px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'export' ? 'var(--accent-teal)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'export' ? '3px solid var(--accent-teal)' : '3px solid transparent',
              fontWeight: activeTab === 'export' ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-fast)'
            }}
          >
            <FileDown size={18} />
            ส่งออกรายชื่อ (Export) ({masseuses.length} คน)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {/* ================= TAB 1: IMPORT ================= */}
          {activeTab === 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Sub-tabs: Input Methods */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    1. เลือกรูปแบบการนำเข้า:
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} />
                    ดาวน์โหลดไฟล์แม่แบบ CSV (Template)
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setInputMethod('paste')}
                    className={`btn ${inputMethod === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px', fontSize: '0.88rem' }}
                  >
                    ✍️ วางข้อความโดยตรง (Direct Paste)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMethod('file')}
                    className={`btn ${inputMethod === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px', fontSize: '0.88rem' }}
                  >
                    📁 อัปโหลดไฟล์ (CSV / TXT / JSON)
                  </button>
                </div>

                {/* Input Method A: Direct Paste */}
                {inputMethod === 'paste' && (
                  <div>
                    <textarea
                      rows={6}
                      className="input-field"
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        fontFamily: 'monospace',
                        fontSize: '0.88rem',
                        lineHeight: 1.5
                      }}
                      placeholder={`วางรายชื่อที่นี่ (คัดลอกจาก Excel หรือ LINE ได้เลย) ตัวอย่าง:
พี่มะลิ
พี่บัว
พี่แก้ว
พี่สายฝน

หรือแบบมีรหัส:
MN-01, พี่มะลิ
MN-02, พี่บัว`}
                      value={pasteText}
                      onChange={handleTextChange}
                    />
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      💡 เคล็ดลับ: สามารถวางเฉพาะชื่อบรรทัดละ 1 ชื่อได้เลย ระบบจะรหัสให้เป็น MN-01, MN-02... อัตโนมัติ
                    </div>
                  </div>
                )}

                {/* Input Method B: File Upload */}
                {inputMethod === 'file' && (
                  <div>
                    <label
                      htmlFor={fileInputId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '30px 20px',
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-teal)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                      <Upload size={36} color="var(--accent-teal)" style={{ marginBottom: '10px' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        รองรับไฟล์ .csv, .txt, .json (UTF-8)
                      </div>
                      {selectedFileName && (
                        <div className="badge badge-teal" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                          📄 {selectedFileName}
                        </div>
                      )}
                    </label>
                    <input
                      id={fileInputId}
                      type="file"
                      accept=".csv, .txt, .json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Step 2: Import Mode */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)'
              }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                  2. เลือกโหมดการบันทึก:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: importMode === 'replace' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: importMode === 'replace' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent'
                  }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      style={{ marginTop: '3px', accentColor: '#8b5cf6' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        🔄 แทนที่รายชื่อทั้งหมด (Replace All)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ล้างรายชื่อหมอนวดเดิมทั้งหมด แล้วใช้รายชื่อใหม่ชุดนี้แทน พร้อมสุ่มแบ่งกลุ่มผู้ประเมินใหม่ให้ทันที
                      </div>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    cursor: 'pointer',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: importMode === 'append' ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                    border: importMode === 'append' ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid transparent'
                  }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      style={{ marginTop: '3px', accentColor: 'var(--accent-teal)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        ➕ เพิ่มต่อท้ายรายชื่อเดิม (Append)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        เก็บรายชื่อเดิมที่มีอยู่ {masseuses.length} คนไว้ และเพิ่มรายชื่อใหม่เข้าไปต่อท้าย
                      </div>
                    </div>
                  </label>
                </div>

                {importMode === 'replace' && (
                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: '#fca5a5',
                    background: 'rgba(239, 68, 68, 0.12)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <AlertCircle size={16} />
                    <span>⚠️ หมายเหตุ: การแทนที่ทั้งหมดจะล้างคะแนนประเมินเดิมเพื่อไม่ให้เกิดความคลาดเคลื่อนกับรายชื่อใหม่</span>
                  </div>
                )}
              </div>

              {/* Step 3: Parse Result & Live Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    3. ตรวจสอบข้อมูลก่อนนำเข้า:
                  </label>
                  {parsedList.length > 0 && (
                    <span className="badge badge-teal" style={{ fontSize: '0.82rem' }}>
                      <CheckCircle2 size={14} /> ตรวจพบ {parsedList.length} รายชื่อ
                    </span>
                  )}
                </div>

                {parseError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    fontSize: '0.85rem',
                    marginBottom: '10px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{parseError}</span>
                  </div>
                )}

                {parsedList.length > 0 ? (
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(15, 23, 42, 0.4)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 12px', width: '50px', textAlign: 'center' }}>ลำดับ</th>
                          <th style={{ padding: '8px 12px', width: '110px' }}>รหัส</th>
                          <th style={{ padding: '8px 12px' }}>ชื่อหมอนวด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedList.map((item, idx) => {
                          const autoCode = item.code || `MN-${(idx + 1).toString().padStart(2, '0')}`;
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                #{idx + 1}
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                                  {autoCode}
                                </span>
                              </td>
                              <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {item.name}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    ยังไม่มีข้อมูล — กรุณาวางรายชื่อหรืออัปโหลดไฟล์ด้านบน
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 2: EXPORT ================= */}
          {activeTab === 'export' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Status Header */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={24} color="var(--accent-teal)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      รายชื่อหมอนวดในระบบปัจจุบัน
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      พร้อมสำหรับส่งออกในหลากหลายรูปแบบ
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-teal)' }}>
                  {masseuses.length} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>คน</span>
                </div>
              </div>

              {/* Export Actions Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                
                {/* 1. CSV Download */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileSpreadsheet size={20} color="#10b981" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>ไฟล์ CSV (Excel)</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      เปิดใน Microsoft Excel หรือ Google Sheets รองรับภาษาไทยสมบูรณ์แบบ (UTF-8 BOM)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                  >
                    <Download size={15} />
                    ดาวน์โหลด .CSV
                  </button>
                </div>

                {/* 2. JSON Download */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileText size={20} color="#3b82f6" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>ไฟล์ JSON Data</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      สำหรับสำรองข้อมูล (Backup) หรือนำไปเชื่อมต่อกับระบบอื่น
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                  >
                    <Download size={15} />
                    ดาวน์โหลด .JSON
                  </button>
                </div>

                {/* 3. Copy Names */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Copy size={20} color="#a78bfa" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>คัดลอกเฉพาะรายชื่อ</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      คัดลอกรายชื่อบรรทัดละคน สะดวกสำหรับส่งต่อในกลุ่ม LINE หรือแชท
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyClipboard('names')}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                  >
                    {copiedType === 'names' ? (
                      <>
                        <Check size={15} color="#10b981" /> คัดลอกสำเร็จ!
                      </>
                    ) : (
                      <>
                        <Copy size={15} /> คัดลอกเฉพาะชื่อ
                      </>
                    )}
                  </button>
                </div>

                {/* 4. Copy Code + Name */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Copy size={20} color="#f59e0b" />
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>คัดลอกรหัส + ชื่อ</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      คัดลอกรหัสคู่กับชื่อ (คั่นด้วยแท็บ สำหรับวางลงในตาราง Excel ได้พอดี)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyClipboard('codes_names')}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                  >
                    {copiedType === 'codes_names' ? (
                      <>
                        <Check size={15} color="#10b981" /> คัดลอกสำเร็จ!
                      </>
                    ) : (
                      <>
                        <Copy size={15} /> คัดลอกรหัสและชื่อ
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Data Preview */}
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  ตัวอย่างรายชื่อที่จะส่งออก ({masseuses.length} คน):
                </label>
                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(15, 23, 42, 0.4)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 12px', width: '50px', textAlign: 'center' }}>ลำดับ</th>
                        <th style={{ padding: '8px 12px', width: '110px' }}>รหัส</th>
                        <th style={{ padding: '8px 12px' }}>ชื่อหมอนวด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masseuses.map((m, idx) => (
                        <tr key={m.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '6px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                              {m.code || `MN-${(idx + 1).toString().padStart(2, '0')}`}
                            </span>
                          </td>
                          <td style={{ padding: '6px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {m.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            {activeTab === 'import' && parsedList.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                พร้อมนำเข้า <strong>{parsedList.length}</strong> รายการ (โหมด: {importMode === 'replace' ? 'แทนที่ทั้งหมด' : 'เพิ่มต่อท้าย'})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              ปิดหน้าต่าง
            </button>

            {activeTab === 'import' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedList.length === 0 || isSubmitting}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  opacity: parsedList.length === 0 ? 0.5 : 1
                }}
              >
                {isSubmitting ? (
                  'กำลังประมวลผล...'
                ) : (
                  <>
                    <Upload size={16} /> ยืนยันนำเข้ารายชื่อ ({parsedList.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
