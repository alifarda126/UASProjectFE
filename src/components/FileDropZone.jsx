/**
 * FileDropZone — Komponen upload file dengan drag & drop.
 *
 * Props:
 *   files       : array of { url, name, size, mime_type, is_image } (sudah tersimpan di S3)
 *   onAdd       : (newFiles: FileDropItem[]) => void  — dipanggil setelah upload sukses
 *   onRemove    : (index: number) => void             — hapus file dari list
 *   uploading   : boolean                             — state loading dari parent
 *   maxFiles    : number (default 5)
 *   disabled    : boolean
 */
import { useRef, useState, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

// Batas ukuran (harus sama dengan backend UploadController.php)
const IMAGE_MAX_MB = 2;
const DOC_MAX_MB   = 5;
const MAX_FILES    = 5;

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DOC_MIMES   = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ICON_MAP = {
  PDF:  'fa-file-pdf text-red-400',
  JPG:  'fa-file-image text-blue-400',
  JPEG: 'fa-file-image text-blue-400',
  PNG:  'fa-file-image text-emerald-400',
  WEBP: 'fa-file-image text-indigo-400',
  DOC:  'fa-file-word text-blue-500',
  DOCX: 'fa-file-word text-blue-500',
};

function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1048576)     return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function FileDropZone({
  files    = [],
  onAdd,
  onRemove,
  maxFiles = MAX_FILES,
  disabled = false,
}) {
  const showToast = useToast();
  const fileRef   = useRef(null);
  const [isDrag,     setIsDrag]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);

  const totalFiles = files.length;
  const canAddMore = totalFiles < maxFiles && !disabled;

  // ── Validasi client-side sebelum upload ──
  const validateFiles = useCallback((incoming) => {
    const valid   = [];
    const invalid = [];

    Array.from(incoming).forEach((f) => {
      const isImage = IMAGE_MIMES.includes(f.type);
      const isDoc   = DOC_MIMES.includes(f.type);

      if (!isImage && !isDoc) {
        invalid.push(`"${f.name}": format tidak didukung`);
        return;
      }

      const maxBytes = isImage ? IMAGE_MAX_MB * 1024 * 1024 : DOC_MAX_MB * 1024 * 1024;
      if (f.size > maxBytes) {
        const limit = isImage ? `${IMAGE_MAX_MB}MB` : `${DOC_MAX_MB}MB`;
        invalid.push(`"${f.name}": melebihi batas ${limit} untuk ${isImage ? 'gambar' : 'dokumen'}`);
        return;
      }

      // Cek duplikat nama+ukuran
      const isDup = files.some((x) => x.name === f.name && x.size === f.size);
      if (isDup) return; // abaikan duplikat diam-diam

      valid.push(f);
    });

    invalid.forEach((msg) => showToast(msg, 'error'));

    // Batasi total file
    const remaining = maxFiles - totalFiles;
    if (valid.length > remaining) {
      showToast(`Maksimal ${maxFiles} file. ${valid.length - remaining} file diabaikan.`, 'warning');
      return valid.slice(0, remaining);
    }

    return valid;
  }, [files, totalFiles, maxFiles, showToast]);

  // ── Upload ke server via multipart/form-data ──
  const uploadFiles = useCallback(async (incoming) => {
    const validFiles = validateFiles(incoming);
    if (!validFiles.length) return;

    setUploading(true);
    setUploadPct(0);

    try {
      const formData = new FormData();
      validFiles.forEach((f) => formData.append('files[]', f));

      const response = await api.post('/upload/doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100));
        },
      });

      const uploaded = response.data?.data ?? [];

      // Tampilkan error parsial jika ada
      (response.data?.errors ?? []).forEach((err) => showToast(err, 'error'));

      if (uploaded.length > 0) {
        onAdd?.(uploaded);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengupload file. Coba lagi.';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
      setUploadPct(0);
      // Reset input agar file yang sama bisa dipilih lagi
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [validateFiles, onAdd, showToast]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDrag(false);
    if (!canAddMore || uploading) return;
    uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      {/* ── Daftar file yang sudah ada ── */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => {
            const ext      = (f.name || '').split('.').pop().toUpperCase();
            const icon     = ICON_MAP[ext] || 'fa-file text-neutral';
            const isImg    = IMAGE_MIMES.includes(f.mime_type || '') || f.is_image;
            const fileUrl  = f.url || f.dataUrl;   // backward compat lama (base64)
            const isOldB64 = fileUrl?.startsWith('data:');

            return (
              <div key={i}
                className="group flex items-center gap-3 p-3 bg-white border border-neutral-light/60
                           rounded-xl hover:border-tertiary/40 hover:shadow-sm transition-all">
                {/* Icon / Preview mini */}
                <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {isImg && fileUrl ? (
                    <img src={fileUrl} alt={f.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <i className={`fas ${icon} text-sm`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-dark truncate">{f.name || 'File'}</p>
                  <p className="text-[11px] text-neutral mt-0.5">
                    {f.size ? formatBytes(f.size) : ''}
                    {!isOldB64 && fileUrl && (
                      <>
                        {' · '}
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-tertiary hover:underline" onClick={(e) => e.stopPropagation()}>
                          Lihat
                        </a>
                      </>
                    )}
                    {isOldB64 && <span className="text-amber-500"> · Tersimpan (lama)</span>}
                  </p>
                </div>

                {/* Status badge */}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full
                                 bg-emerald-50 text-emerald-600 flex-shrink-0 hidden group-hover:hidden">
                  ✓
                </span>

                {/* Tombol hapus */}
                {!disabled && (
                  <button type="button" onClick={() => onRemove?.(i)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center
                               text-neutral-light hover:text-red-500 transition-colors flex-shrink-0">
                    <i className="fas fa-times text-xs" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Drop Zone ── */}
      {canAddMore && (
        <div
          className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer select-none
            ${isDrag
              ? 'border-tertiary bg-tertiary/5 scale-[1.01]'
              : 'border-neutral-light/70 hover:border-tertiary/50 hover:bg-neutral-50/60'}
            ${uploading ? 'pointer-events-none opacity-70' : ''}`}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
          onDragEnter={(e) => { e.preventDefault(); setIsDrag(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDrag(false); }}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
            multiple
            onChange={(e) => { uploadFiles(e.target.files); }}
          />

          <div className="p-4 flex flex-col items-center gap-1.5">
            {uploading ? (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-tertiary/30 border-t-tertiary
                                animate-spin mb-1" />
                <p className="text-xs font-medium text-tertiary">Mengupload... {uploadPct}%</p>
                <div className="w-32 h-1.5 bg-neutral-light rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-tertiary rounded-full transition-all duration-300"
                    style={{ width: `${uploadPct}%` }} />
                </div>
              </>
            ) : (
              <>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5
                  ${isDrag ? 'bg-tertiary text-white' : 'bg-neutral-50 text-neutral-light'} transition-all`}>
                  <i className={`fas ${isDrag ? 'fa-cloud-download-alt' : 'fa-cloud-upload-alt'} text-lg`} />
                </div>
                <p className="text-xs font-semibold text-neutral-dark">
                  {isDrag ? 'Lepaskan file di sini' : 'Klik atau seret file ke sini'}
                </p>

                {/* Info batasan */}
                <div className="flex items-center gap-3 mt-1 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1 text-[10px] text-neutral bg-neutral-50
                                   border border-neutral-light/50 rounded-full px-2 py-0.5">
                    <i className="fas fa-image text-blue-400 text-[9px]" />
                    JPG/PNG/WEBP — maks. {IMAGE_MAX_MB}MB
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-neutral bg-neutral-50
                                   border border-neutral-light/50 rounded-full px-2 py-0.5">
                    <i className="fas fa-file-alt text-red-400 text-[9px]" />
                    PDF/DOC — maks. {DOC_MAX_MB}MB
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-neutral bg-neutral-50
                                   border border-neutral-light/50 rounded-full px-2 py-0.5">
                    <i className="fas fa-layer-group text-neutral text-[9px]" />
                    Maks. {maxFiles} file
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Counter sisa slot */}
          {!uploading && (
            <div className="absolute top-2 right-2 text-[10px] text-neutral bg-white/80
                            border border-neutral-light/40 rounded-full px-1.5 py-0.5 font-medium">
              {totalFiles}/{maxFiles}
            </div>
          )}
        </div>
      )}

      {/* Pesan saat slot penuh */}
      {!canAddMore && !disabled && (
        <p className="text-[11px] text-amber-600 text-center py-1">
          <i className="fas fa-exclamation-circle mr-1" />
          Sudah mencapai batas maksimal {maxFiles} file.
        </p>
      )}
    </div>
  );
}
