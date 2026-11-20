import React, { useState } from 'react';
import { SamsatDailyEntry } from '../types';
import { formatRupiah, formatNumber, formatDateIndonesian, getMonthName } from '../utils/formatters';
import { X, Printer, Camera, AlertCircle } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: SamsatDailyEntry[];
  selectedMonth: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  entries,
  selectedMonth
}) => {
  const [includePhotos, setIncludePhotos] = useState(true);
  const [popupError, setPopupError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter entries
  const filtered = selectedMonth 
    ? entries.filter((e) => e.tanggal.startsWith(selectedMonth))
    : entries;

  const entriesWithPhotos = filtered.filter(
    (e) => Array.isArray(e.fotoKegiatan) && e.fotoKegiatan.length > 0
  );
  const totalPhotoCount = entriesWithPhotos.reduce(
    (sum, e) => sum + (e.fotoKegiatan?.length || 0),
    0
  );

  // Calculate totals
  const totals = filtered.reduce(
    (acc, curr) => {
      const bUnit = curr.realisasiBangliNopol;
      const bRp = curr.realisasiBangliRp;
      const lUnit = curr.realisasiLuarNopol;
      const lRp = curr.realisasiLuarRp;

      return {
        bangliNopol: acc.bangliNopol + bUnit,
        bangliRp: acc.bangliRp + bRp,
        luarNopol: acc.luarNopol + lUnit,
        luarRp: acc.luarRp + lRp,
        jmlBangliUnit: acc.jmlBangliUnit + bUnit,
        jmlBangliRp: acc.jmlBangliRp + bRp,
        jmlLuarUnit: acc.jmlLuarUnit + lUnit,
        jmlLuarRp: acc.jmlLuarRp + lRp,
        totalUnit: acc.totalUnit + (bUnit + lUnit),
        totalRp: acc.totalRp + (bRp + lRp),
      };
    },
    {
      bangliNopol: 0,
      bangliRp: 0,
      luarNopol: 0,
      luarRp: 0,
      jmlBangliUnit: 0,
      jmlBangliRp: 0,
      jmlLuarUnit: 0,
      jmlLuarRp: 0,
      totalUnit: 0,
      totalRp: 0,
    }
  );

  const handlePrint = () => {
    setPopupError(null);
    try {
      window.print();
    } catch (e) {
      console.error('Direct print failed, attempting popup print:', e);
      handlePrintPopup();
    }
  };

  const handlePrintPopup = () => {
    setPopupError(null);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setPopupError('Gagal membuka jendela cetak. Izinkan popup di browser Anda atau gunakan tombol "Cetak Sekarang".');
      return;
    }
    const tableElement = document.getElementById('printable-report-content');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Realisasi Samsat Metulung Desa</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; margin: 0; }
            .report-header { text-align: center; margin-bottom: 16px; }
            .report-header h3 { text-align: center; margin: 0 0 4px 0; text-transform: uppercase; text-decoration: underline; font-size: 16px; }
            .report-header p { margin: 2px 0; font-size: 12px; color: #333; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #000; padding: 5px; }
            th { background-color: #e2e8f0; text-align: center; font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold, .font-semibold, .font-extrabold { font-weight: bold; }
            .report-photo-section { margin-top: 24px; padding-top: 16px; border-top: 2px solid #0f172a; }
            .report-photo-section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; }
            .report-photo-section-sub { font-size: 11px; color: #475569; margin: 0 0 14px 0; }
            .report-photo-card { border: 1px solid #94a3b8; border-radius: 6px; padding: 10px; margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid; }
            .report-photo-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 10px; font-size: 11px; }
            .report-photo-card-title { font-weight: bold; font-size: 12px; color: #0f172a; }
            .report-photo-card-meta { color: #475569; font-size: 10px; margin-top: 2px; }
            .report-photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .report-photo-item { border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #f8fafc; break-inside: avoid; page-break-inside: avoid; }
            .report-photo-item img { width: 100%; height: 180px; object-fit: cover; display: block; }
            .report-photo-caption { padding: 4px 8px; font-size: 10px; color: #334155; font-weight: bold; border-top: 1px solid #e2e8f0; background: #fff; }
            .report-empty-photos { border: 1px dashed #94a3b8; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
            @media print {
              body { padding: 0; }
              thead { display: table-header-group; }
              tr, .report-photo-card, .report-photo-item { break-inside: avoid; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${tableElement ? tableElement.innerHTML : ''}
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:rounded-none">
        
        {/* Modal Controls Bar (Hidden during window.print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">Pratinjau Cetak Laporan Realisasi</h3>
              <p className="text-[11px] text-slate-400">Siap cetak atau simpan sebagai file PDF</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span className="whitespace-nowrap">Foto Kegiatan ({totalPhotoCount})</span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPopup}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer whitespace-nowrap"
              title="Buka jendela baru untuk mencetak"
            >
              <span>Jendela Cetak Baru</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {popupError && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 no-print">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{popupError}</span>
          </div>
        )}

        {/* Printable Paper Canvas */}
        <div 
          id="printable-report-content" 
          className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 space-y-5 print:p-0 print:overflow-visible printable-area"
        >
          
          {/* DOCUMENT TITLE & METADATA */}
          <div className="report-header text-center space-y-1 mb-4">
            <h3 className="text-base sm:text-lg font-black uppercase underline decoration-2 underline-offset-4">
              LAPORAN REALISASI PENERIMAAN PAJAK SAMSAT METULUNG DESA
            </h3>
            <p className="text-xs font-sans font-semibold text-slate-700">
              {selectedMonth ? `PERIODE: BULAN ${getMonthName(selectedMonth).toUpperCase()}` : 'PERIODE: REKAPITULASI KESELURUHAN'}
            </p>
            <p className="text-[11px] font-sans text-slate-500">
              Kabupaten Bangli, Provinsi Bali
            </p>
          </div>

          {/* TABLE STRUCTURE */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-[11px] border-collapse border border-slate-900 text-slate-900 font-sans">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-900 uppercase">
                  <th rowSpan={2} className="border border-slate-900 p-1.5 w-8">NO</th>
                  <th rowSpan={2} className="border border-slate-900 p-1.5 whitespace-nowrap">TANGGAL</th>
                  <th rowSpan={2} className="border border-slate-900 p-1.5 text-left min-w-[150px]">KANTOR DESA</th>
                  <th colSpan={2} className="border border-slate-900 p-1 bg-slate-300">REALISASI NOPOL BANGLI</th>
                  <th colSpan={2} className="border border-slate-900 p-1 bg-slate-300">REALISASI NOPOL LUAR BANGLI</th>
                  <th colSpan={2} className="border border-slate-900 p-1 bg-slate-200">JML BANGLI</th>
                  <th colSpan={2} className="border border-slate-900 p-1 bg-slate-200">JML LUAR BANGLI</th>
                  <th colSpan={2} className="border border-slate-900 p-1 bg-slate-300">TOTAL</th>
                </tr>
                <tr className="bg-slate-100 text-center font-semibold border-b border-slate-900">
                  <th className="border border-slate-900 p-1">Nopol</th>
                  <th className="border border-slate-900 p-1">Rp</th>
                  <th className="border border-slate-900 p-1">Nopol</th>
                  <th className="border border-slate-900 p-1">Rp</th>
                  <th className="border border-slate-900 p-1">Unit</th>
                  <th className="border border-slate-900 p-1">Rp</th>
                  <th className="border border-slate-900 p-1">Unit</th>
                  <th className="border border-slate-900 p-1">Rp</th>
                  <th className="border border-slate-900 p-1">Unit</th>
                  <th className="border border-slate-900 p-1">Rp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-4 text-center text-slate-500 font-semibold">
                      Tidak ada data realisasi.
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, idx) => {
                    const bUnit = entry.realisasiBangliNopol;
                    const bRp = entry.realisasiBangliRp;
                    const lUnit = entry.realisasiLuarNopol;
                    const lRp = entry.realisasiLuarRp;
                    const totUnit = bUnit + lUnit;
                    const totRp = bRp + lRp;

                    return (
                      <tr key={entry.id} className="border-b border-slate-400">
                        <td className="border border-slate-900 p-1.5 text-center font-bold tabular-nums">{idx + 1}</td>
                        <td className="border border-slate-900 p-1.5 text-center whitespace-nowrap tabular-nums">{entry.tanggal}</td>
                        <td className="border border-slate-900 p-1.5 font-semibold">{entry.kantorDesa}</td>
                        <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(bUnit)}</td>
                        <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(bRp)}</td>
                        <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(lUnit)}</td>
                        <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(lRp)}</td>
                        <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(bUnit)}</td>
                        <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(bRp)}</td>
                        <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(lUnit)}</td>
                        <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(lRp)}</td>
                        <td className="border border-slate-900 p-1.5 text-center font-bold tabular-nums">{formatNumber(totUnit)}</td>
                        <td className="border border-slate-900 p-1.5 text-right font-bold tabular-nums">{formatRupiah(totRp)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 text-slate-900 font-extrabold border-t-2 border-slate-900">
                  <td colSpan={3} className="border border-slate-900 p-2 text-center uppercase">JUMLAH KESELURUHAN</td>
                  <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(totals.bangliNopol)}</td>
                  <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(totals.bangliRp)}</td>
                  <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(totals.luarNopol)}</td>
                  <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(totals.luarRp)}</td>
                  <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(totals.jmlBangliUnit)}</td>
                  <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(totals.jmlBangliRp)}</td>
                  <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(totals.jmlLuarUnit)}</td>
                  <td className="border border-slate-900 p-1.5 text-right tabular-nums">{formatRupiah(totals.jmlLuarRp)}</td>
                  <td className="border border-slate-900 p-1.5 text-center tabular-nums">{formatNumber(totals.totalUnit)}</td>
                  <td className="border border-slate-900 p-1.5 text-right text-xs tabular-nums">{formatRupiah(totals.totalRp)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* LAMPIRAN FOTO KEGIATAN */}
          {includePhotos && (
            <div className="report-photo-section mt-6 pt-5 border-t-2 border-slate-900 space-y-4">
              <div>
                <h4 className="report-photo-section-title text-sm font-bold uppercase tracking-wide text-slate-900">
                  Lampiran Dokumentasi Foto Kegiatan
                </h4>
                <p className="report-photo-section-sub text-xs text-slate-600 mt-0.5">
                  {entriesWithPhotos.length > 0
                    ? `Menampilkan ${totalPhotoCount} foto dokumentasi dari ${entriesWithPhotos.length} kegiatan pelayanan.`
                    : 'Dokumentasi kegiatan pelayanan Samsat Metulung Desa.'}
                </p>
              </div>

              {entriesWithPhotos.length === 0 ? (
                <div className="report-empty-photos border border-dashed border-slate-300 rounded-lg p-5 text-center text-xs text-slate-500">
                  Belum ada foto kegiatan yang dilampirkan pada data periode ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {entriesWithPhotos.map((entry, idx) => {
                    const photos = entry.fotoKegiatan || [];
                    const totalUnit = entry.realisasiBangliNopol + entry.realisasiLuarNopol;
                    const totalRp = entry.realisasiBangliRp + entry.realisasiLuarRp;

                    return (
                      <div
                        key={entry.id}
                        className="report-photo-card print-avoid-break border border-slate-300 rounded-lg p-3.5 bg-white space-y-3"
                      >
                        <div className="report-photo-card-header flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2">
                          <div>
                            <div className="report-photo-card-title text-xs font-bold text-slate-900">
                              {idx + 1}. {entry.kantorDesa} &mdash; {formatDateIndonesian(entry.tanggal)}
                            </div>
                            <div className="report-photo-card-meta text-[11px] text-slate-600 mt-0.5">
                              {entry.petugas ? `Petugas: ${entry.petugas}` : 'Petugas Samsat'}
                              {entry.catatan ? ` · Catatan: ${entry.catatan}` : ''}
                            </div>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 tabular-nums whitespace-nowrap">
                            Realisasi: {formatNumber(totalUnit)} Unit ({formatRupiah(totalRp)})
                          </div>
                        </div>

                        <div className="report-photo-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {photos.map((photoUrl, photoIdx) => (
                            <div
                              key={photoIdx}
                              className="report-photo-item print-avoid-break border border-slate-300 rounded-md overflow-hidden bg-slate-50"
                            >
                              <img
                                src={photoUrl}
                                alt={`Dokumentasi ${entry.kantorDesa} ${entry.tanggal} - Foto ${photoIdx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-48 object-cover block"
                              />
                              <div className="report-photo-caption px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border-t border-slate-200">
                                Foto {photoIdx + 1} &middot; {entry.kantorDesa} ({formatDateIndonesian(entry.tanggal)})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
