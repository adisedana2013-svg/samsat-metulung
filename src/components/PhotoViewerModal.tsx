import React, { useState, useEffect } from 'react';
import { SamsatDailyEntry } from '../types';
import { formatDateIndonesian } from '../utils/formatters';
import {
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Building2,
  Calendar,
  User,
  FileText,
  Edit3,
  ImageOff,
  Plus
} from 'lucide-react';

interface PhotoViewerModalProps {
  entry: SamsatDailyEntry | null;
  onClose: () => void;
  onEditEntry: (entry: SamsatDailyEntry) => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  entry,
  onClose,
  onEditEntry,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenIndices, setBrokenIndices] = useState<Record<number, boolean>>({});

  const photos = entry?.fotoKegiatan || [];

  useEffect(() => {
    setActiveIndex(0);
    setBrokenIndices({});
  }, [entry?.id]);

  useEffect(() => {
    if (!entry) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setActiveIndex((prev) => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entry, photos.length, onClose]);

  if (!entry) return null;

  const currentPhoto = photos[activeIndex];

  const handleDownload = () => {
    if (!currentPhoto) return;
    const link = document.createElement('a');
    link.href = currentPhoto;
    const safeDesa = entry.kantorDesa.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Foto_Kegiatan_${entry.tanggal}_${safeDesa}_${activeIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="truncate">Dokumentasi Foto Kegiatan</span>
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-white">{entry.kantorDesa}</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDateIndonesian(entry.tanggal)}</span>
              </span>
              {entry.petugas && (
                <>
                  <span aria-hidden="true" className="text-slate-600">&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{entry.petugas}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          {photos.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ImageOff className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Belum Ada Foto Kegiatan
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Data realisasi tanggal {formatDateIndonesian(entry.tanggal)} di {entry.kantorDesa} belum memiliki lampiran foto dokumentasi kegiatan.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Foto Kegiatan</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Main Photo Display */}
              <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[280px] sm:min-h-[380px]">
                {brokenIndices[activeIndex] ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <ImageOff className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-xs">Foto tidak dapat ditampilkan.</p>
                  </div>
                ) : (
                  <img
                    src={currentPhoto}
                    alt={`Foto kegiatan ${entry.kantorDesa} (${activeIndex + 1})`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenIndices((prev) => ({ ...prev, [activeIndex]: true }))
                    }
                    className="max-h-[55vh] w-auto max-w-full object-contain select-none"
                  />
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Foto Sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((prev) => (prev + 1) % photos.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      title="Foto Berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700 tabular-nums">
                  {activeIndex + 1} / {photos.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        idx === activeIndex
                          ? 'border-amber-500 ring-2 ring-amber-500/30'
                          : 'border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notes if available */}
          {entry.catatan && (
            <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Catatan Kegiatan: </span>
                <span>{entry.catatan}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEditEntry(entry)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{photos.length > 0 ? 'Kelola / Tambah Foto' : 'Edit Data & Foto'}</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {photos.length > 0 && currentPhoto && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Foto</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
