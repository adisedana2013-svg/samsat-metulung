import React, { useState, useEffect, useRef } from 'react';
import { SamsatDailyEntry, VehicleTransaction } from '../types';
import { formatRupiah } from '../utils/formatters';
import { compressActivityPhoto } from '../utils/imageUtils';
import { X, Save, Building2, Calendar, User, FileText, Calculator, Car, Plus, Trash2, CheckCircle2, Camera, Upload, Loader2, AlertCircle } from 'lucide-react';

interface InputVehicleItem {
  id: string;
  platNomor: string;
  nominalRp: number;
  namaPemilik: string;
  jenisKendaraan: 'R2' | 'R4' | 'R6+';
  isBangli: boolean;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<SamsatDailyEntry>, vehicleItems?: VehicleTransaction[]) => void;
  initialData?: SamsatDailyEntry | null;
  listKantorDesa: string[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  listKantorDesa,
}) => {
  const [tanggal, setTanggal] = useState('2026-07-30');
  const [kantorDesa, setKantorDesa] = useState(listKantorDesa[0] || 'Kantor Desa Batur Tengah');
  const [customDesa, setCustomDesa] = useState('');
  const [isCustomDesa, setIsCustomDesa] = useState(false);

  // List of entered vehicle items for Bangli and Luar Bangli
  const [bangliVehicles, setBangliVehicles] = useState<InputVehicleItem[]>([]);
  const [luarVehicles, setLuarVehicles] = useState<InputVehicleItem[]>([]);

  // Form states for adding single vehicle item - Bangli
  const [tempBangliPlat, setTempBangliPlat] = useState('DK ');
  const [tempBangliRp, setTempBangliRp] = useState<number | ''>(850000);
  const [tempBangliNama, setTempBangliNama] = useState('');
  const [tempBangliJenis, setTempBangliJenis] = useState<'R2' | 'R4' | 'R6+'>('R2');

  // Form states for adding single vehicle item - Luar Bangli
  const [tempLuarPlat, setTempLuarPlat] = useState('DK ');
  const [tempLuarRp, setTempLuarRp] = useState<number | ''>(800000);
  const [tempLuarNama, setTempLuarNama] = useState('');
  const [tempLuarJenis, setTempLuarJenis] = useState<'R2' | 'R4' | 'R6+'>('R2');

  // Manual overriding totals if needed
  const [realisasiBangliNopol, setRealisasiBangliNopol] = useState<number | ''>(10);
  const [realisasiBangliRp, setRealisasiBangliRp] = useState<number | ''>(8500000);

  const [realisasiLuarNopol, setRealisasiLuarNopol] = useState<number | ''>(3);
  const [realisasiLuarRp, setRealisasiLuarRp] = useState<number | ''>(2400000);

  const [petugas, setPetugas] = useState('I Wayan Sudiarta, S.H.');
  const [catatan, setCatatan] = useState('');
  const [fotoKegiatan, setFotoKegiatan] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 6;

  useEffect(() => {
    setPhotoError(null);
    setFormError(null);
    if (initialData) {
      setTanggal(initialData.tanggal);
      if (listKantorDesa.includes(initialData.kantorDesa)) {
        setKantorDesa(initialData.kantorDesa);
        setIsCustomDesa(false);
      } else {
        setIsCustomDesa(true);
        setCustomDesa(initialData.kantorDesa);
      }
      setRealisasiBangliNopol(initialData.realisasiBangliNopol);
      setRealisasiBangliRp(initialData.realisasiBangliRp);
      setRealisasiLuarNopol(initialData.realisasiLuarNopol);
      setRealisasiLuarRp(initialData.realisasiLuarRp);
      setPetugas(initialData.petugas || '');
      setCatatan(initialData.catatan || '');
      setFotoKegiatan(initialData.fotoKegiatan || []);
      setBangliVehicles([]);
      setLuarVehicles([]);
    } else {
      // Default new entry
      const today = new Date().toISOString().substring(0, 10);
      setTanggal(today);
      setKantorDesa(listKantorDesa[0] || 'Kantor Desa Batur Tengah');
      setIsCustomDesa(false);
      setCustomDesa('');
      setRealisasiBangliNopol('');
      setRealisasiBangliRp('');
      setRealisasiLuarNopol('');
      setRealisasiLuarRp('');
      setCatatan('');
      setFotoKegiatan([]);
      setBangliVehicles([]);
      setLuarVehicles([]);
    }
  }, [initialData, isOpen, listKantorDesa]);

  const handleProcessPhotoFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setPhotoError(null);
    const remainingSlots = MAX_PHOTOS - fotoKegiatan.length;

    if (remainingSlots <= 0) {
      setPhotoError(`Maksimal ${MAX_PHOTOS} foto kegiatan per entri.`);
      return;
    }

    const filesToProcess = fileList.slice(0, remainingSlots);
    if (fileList.length > remainingSlots) {
      setPhotoError(`Hanya ${remainingSlots} foto tambahan yang diproses (maks. ${MAX_PHOTOS} foto).`);
    }

    setIsUploadingPhoto(true);
    try {
      const compressedList: string[] = [];
      for (const file of filesToProcess) {
        const compressed = await compressActivityPhoto(file);
        compressedList.push(compressed);
      }
      setFotoKegiatan((prev) => [...prev, ...compressedList]);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal memproses foto kegiatan.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFotoKegiatan((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPhotoError(null);
  };

  // Handle adding Bangli vehicle item
  const handleAddBangliVehicle = () => {
    setFormError(null);
    if (!tempBangliPlat.trim() || tempBangliPlat.trim() === 'DK') {
      setFormError('Mohon isi Plat Nomor Bangli yang valid.');
      return;
    }
    const nominal = Number(tempBangliRp) || 0;
    const newItem: InputVehicleItem = {
      id: 'v-bangli-' + Date.now() + Math.random().toString(36).substr(2, 4),
      platNomor: tempBangliPlat.toUpperCase().trim(),
      nominalRp: nominal,
      namaPemilik: tempBangliNama.trim() || 'Wajib Pajak (Bangli)',
      jenisKendaraan: tempBangliJenis,
      isBangli: true
    };

    const newBangliList = [...bangliVehicles, newItem];
    setBangliVehicles(newBangliList);

    // Auto calculate totals
    setRealisasiBangliNopol(newBangliList.length);
    setRealisasiBangliRp(newBangliList.reduce((sum, v) => sum + v.nominalRp, 0));

    // Reset inputs
    setTempBangliPlat('DK ');
    setTempBangliRp(850000);
    setTempBangliNama('');
  };

  const handleRemoveBangliVehicle = (id: string) => {
    const newBangliList = bangliVehicles.filter(item => item.id !== id);
    setBangliVehicles(newBangliList);
    setRealisasiBangliNopol(newBangliList.length);
    setRealisasiBangliRp(newBangliList.reduce((sum, v) => sum + v.nominalRp, 0));
  };

  // Handle adding Luar Bangli vehicle item
  const handleAddLuarVehicle = () => {
    setFormError(null);
    if (!tempLuarPlat.trim() || tempLuarPlat.trim() === 'DK') {
      setFormError('Mohon isi Plat Nomor Luar Bangli yang valid.');
      return;
    }
    const nominal = Number(tempLuarRp) || 0;
    const newItem: InputVehicleItem = {
      id: 'v-luar-' + Date.now() + Math.random().toString(36).substr(2, 4),
      platNomor: tempLuarPlat.toUpperCase().trim(),
      nominalRp: nominal,
      namaPemilik: tempLuarNama.trim() || 'Wajib Pajak (Luar Bangli)',
      jenisKendaraan: tempLuarJenis,
      isBangli: false
    };

    const newLuarList = [...luarVehicles, newItem];
    setLuarVehicles(newLuarList);

    // Auto calculate totals
    setRealisasiLuarNopol(newLuarList.length);
    setRealisasiLuarRp(newLuarList.reduce((sum, v) => sum + v.nominalRp, 0));

    // Reset inputs
    setTempLuarPlat('DK ');
    setTempLuarRp(800000);
    setTempLuarNama('');
  };

  const handleRemoveLuarVehicle = (id: string) => {
    const newLuarList = luarVehicles.filter(item => item.id !== id);
    setLuarVehicles(newLuarList);
    setRealisasiLuarNopol(newLuarList.length);
    setRealisasiLuarRp(newLuarList.reduce((sum, v) => sum + v.nominalRp, 0));
  };

  if (!isOpen) return null;

  // Computed previews
  const bangliUnitVal = Number(realisasiBangliNopol) || 0;
  const bangliRpVal = Number(realisasiBangliRp) || 0;
  const luarUnitVal = Number(realisasiLuarNopol) || 0;
  const luarRpVal = Number(realisasiLuarRp) || 0;

  const totalUnitVal = bangliUnitVal + luarUnitVal;
  const totalRpVal = bangliRpVal + luarRpVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const finalDesa = isCustomDesa ? customDesa : kantorDesa;
    if (!finalDesa.trim()) {
      setFormError('Mohon isi nama Kantor Desa.');
      return;
    }

    // Convert internal vehicle items to VehicleTransaction objects
    const finalDesaName = finalDesa.trim();
    const generatedVehicles: VehicleTransaction[] = [
      ...bangliVehicles.map((bv) => ({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        tanggal,
        kantorDesa: finalDesaName,
        platNomor: bv.platNomor,
        isBangli: true,
        namaPemilik: bv.namaPemilik,
        jenisKendaraan: bv.jenisKendaraan,
        merkModel: 'Kendaraan ' + bv.jenisKendaraan,
        nominalPkb: Math.round(bv.nominalRp * 0.8),
        nominalSwdkllj: Math.round(bv.nominalRp * 0.12),
        nominalAdmin: Math.round(bv.nominalRp * 0.08),
        totalBayar: bv.nominalRp
      })),
      ...luarVehicles.map((lv) => ({
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        tanggal,
        kantorDesa: finalDesaName,
        platNomor: lv.platNomor,
        isBangli: false,
        namaPemilik: lv.namaPemilik,
        jenisKendaraan: lv.jenisKendaraan,
        merkModel: 'Kendaraan ' + lv.jenisKendaraan,
        nominalPkb: Math.round(lv.nominalRp * 0.8),
        nominalSwdkllj: Math.round(lv.nominalRp * 0.12),
        nominalAdmin: Math.round(lv.nominalRp * 0.08),
        totalBayar: lv.nominalRp
      }))
    ];

    onSave(
      {
        id: initialData?.id,
        tanggal,
        kantorDesa: finalDesaName,
        realisasiBangliNopol: bangliUnitVal,
        realisasiBangliRp: bangliRpVal,
        realisasiLuarNopol: luarUnitVal,
        realisasiLuarRp: luarRpVal,
        petugas,
        catatan,
        fotoKegiatan
      },
      generatedVehicles
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>{initialData ? 'Edit Data Realisasi Samsat' : 'Input Data Realisasi Baru'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input Nopol &amp; nominal bayar untuk otomatis masuk ke Rincian Kendaraan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Row 1: Tanggal & Kantor Desa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Tanggal Pelayanan *</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            {/* Kantor Desa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Kantor Desa *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDesa(!isCustomDesa)}
                  className="text-[11px] text-amber-700 hover:underline font-semibold cursor-pointer"
                >
                  {isCustomDesa ? 'Pilih dari Daftar' : '+ Ketik Manual'}
                </button>
              </div>

              {isCustomDesa ? (
                <input
                  type="text"
                  placeholder="Contoh: Kantor Desa Terunyan"
                  value={customDesa}
                  onChange={(e) => setCustomDesa(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                />
              ) : (
                <select
                  value={kantorDesa}
                  onChange={(e) => setKantorDesa(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
                >
                  {listKantorDesa.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

          </div>

          {/* Section: Realisasi Nopol Bangli */}
          <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-sky-600" />
                <span>REALISASI NOPOL BANGLI (Plat Kode Bangli)</span>
              </h4>
              <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                {bangliVehicles.length} Nopol Terinput
              </span>
            </div>

            {/* Sub-form input single Nopol Bangli */}
            <div className="bg-white p-3 rounded-lg border border-sky-200 space-y-2">
              <span className="text-[11px] font-bold text-sky-900 block">
                + Input Rincian Nopol Bangli (Otomatis masuk ke Rincian Kendaraan):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Plat Nomor (Nopol)</label>
                  <input
                    type="text"
                    placeholder="DK 3412 PAB"
                    value={tempBangliPlat}
                    onChange={(e) => setTempBangliPlat(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold uppercase"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Jumlah Nominal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="850000"
                    value={tempBangliRp}
                    onChange={(e) => setTempBangliRp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Wajib Pajak</label>
                  <input
                    type="text"
                    placeholder="Nama Pemilik"
                    value={tempBangliNama}
                    onChange={(e) => setTempBangliNama(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddBangliVehicle}
                    className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Nopol</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Added Bangli Vehicles Badge List */}
            {bangliVehicles.length > 0 && (
              <div className="bg-sky-100/60 p-2.5 rounded-lg border border-sky-200 space-y-1.5">
                <span className="text-[11px] font-bold text-sky-900 block">Daftar Nopol Bangli Terdaftar:</span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {bangliVehicles.map((item) => (
                    <div key={item.id} className="inline-flex items-center gap-1.5 bg-white border border-sky-300 px-2.5 py-1 rounded-md text-xs shadow-2xs">
                      <span className="font-mono font-black text-sky-950">{item.platNomor}</span>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-sky-800">{formatRupiah(item.nominalRp)}</span>
                      {item.namaPemilik && <span className="text-[10px] text-slate-500">({item.namaPemilik})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveBangliVehicle(item.id)}
                        className="p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer ml-1"
                        title="Hapus Nopol"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Nopol Bangli (Unit) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="0"
                  value={realisasiBangliNopol}
                  onChange={(e) => setRealisasiBangliNopol(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-sky-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Realisasi Nominal Bangli (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="0"
                  value={realisasiBangliRp}
                  onChange={(e) => setRealisasiBangliRp(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-sky-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-bold"
                />
                <p className="text-[10px] text-sky-700 mt-0.5">
                  Format: {formatRupiah(bangliRpVal)}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Realisasi Nopol Luar Bangli */}
          <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-600" />
                <span>REALISASI NOPOL LUAR BANGLI (Plat Luar Bangli)</span>
              </h4>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                {luarVehicles.length} Nopol Terinput
              </span>
            </div>

            {/* Sub-form input single Nopol Luar Bangli */}
            <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 block">
                + Input Rincian Nopol Luar Bangli (Otomatis masuk ke Rincian Kendaraan):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Plat Nomor (Nopol)</label>
                  <input
                    type="text"
                    placeholder="DK 1829 FA"
                    value={tempLuarPlat}
                    onChange={(e) => setTempLuarPlat(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold uppercase"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Jumlah Nominal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="800000"
                    value={tempLuarRp}
                    onChange={(e) => setTempLuarRp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-bold text-slate-900"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nama Wajib Pajak</label>
                  <input
                    type="text"
                    placeholder="Nama Pemilik"
                    value={tempLuarNama}
                    onChange={(e) => setTempLuarNama(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddLuarVehicle}
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Nopol</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Added Luar Bangli Vehicles Badge List */}
            {luarVehicles.length > 0 && (
              <div className="bg-amber-100/60 p-2.5 rounded-lg border border-amber-200 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 block">Daftar Nopol Luar Bangli Terdaftar:</span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  {luarVehicles.map((item) => (
                    <div key={item.id} className="inline-flex items-center gap-1.5 bg-white border border-amber-300 px-2.5 py-1 rounded-md text-xs shadow-2xs">
                      <span className="font-mono font-black text-amber-950">{item.platNomor}</span>
                      <span className="text-slate-400">|</span>
                      <span className="font-bold text-amber-800">{formatRupiah(item.nominalRp)}</span>
                      {item.namaPemilik && <span className="text-[10px] text-slate-500">({item.namaPemilik})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveLuarVehicle(item.id)}
                        className="p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer ml-1"
                        title="Hapus Nopol"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Nopol Luar Bangli (Unit) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="0"
                  value={realisasiLuarNopol}
                  onChange={(e) => setRealisasiLuarNopol(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Realisasi Nominal Luar Bangli (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="0"
                  value={realisasiLuarRp}
                  onChange={(e) => setRealisasiLuarRp(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-bold"
                />
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Format: {formatRupiah(luarRpVal)}
                </p>
              </div>
            </div>
          </div>

          {/* Automatic Calculation Preview Box */}
          <div className="bg-emerald-950 text-white p-4 rounded-xl space-y-2 border border-emerald-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                <span>Ringkasan Otomatis Row Tabel (TOTAL)</span>
              </div>
              {(bangliVehicles.length > 0 || luarVehicles.length > 0) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {bangliVehicles.length + luarVehicles.length} Transaksi Otomatis Masuk Rincian Kendaraan
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-emerald-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-emerald-300 block">JML BANGLI</span>
                <span className="font-bold text-white">{bangliUnitVal} Unit</span>
                <span className="block text-[11px] text-emerald-200 mt-0.5">{formatRupiah(bangliRpVal)}</span>
              </div>

              <div className="bg-emerald-900/60 p-2 rounded-lg">
                <span className="text-[10px] text-emerald-300 block">JML LUAR BANGLI</span>
                <span className="font-bold text-white">{luarUnitVal} Unit</span>
                <span className="block text-[11px] text-emerald-200 mt-0.5">{formatRupiah(luarRpVal)}</span>
              </div>

              <div className="bg-emerald-800 p-2 rounded-lg ring-1 ring-emerald-400/40">
                <span className="text-[10px] text-amber-300 font-extrabold block">TOTAL KESELURUHAN</span>
                <span className="font-extrabold text-white text-sm">{totalUnitVal} Unit</span>
                <span className="block font-black text-amber-300 mt-0.5">{formatRupiah(totalRpVal)}</span>
              </div>
            </div>
          </div>

          {/* Row: Petugas & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Petugas Pelaksana</span>
              </label>
              <input
                type="text"
                placeholder="Nama Petugas Samsat Metulung Desa"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Kegiatan</span>
              </label>
              <input
                type="text"
                placeholder="Misal: Bertempat di Balai Desa..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Section: Foto Kegiatan */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">
                  Foto Kegiatan (Dokumentasi)
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                {fotoKegiatan.length} / {MAX_PHOTOS} Foto
              </span>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleProcessPhotoFiles(e.target.files);
                }
              }}
              className="hidden"
            />

            {fotoKegiatan.length < MAX_PHOTOS && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(false);
                  if (e.dataTransfer.files) {
                    handleProcessPhotoFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                  isDraggingPhoto
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/40'
                }`}
              >
                {isUploadingPhoto ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-1 text-amber-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-semibold">Memproses &amp; mengompresi foto...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-0.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Klik untuk pilih foto atau seret gambar ke sini
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Format JPG, PNG, WebP &middot; Maks. {MAX_PHOTOS} foto kegiatan
                    </p>
                  </div>
                )}
              </div>
            )}

            {photoError && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {fotoKegiatan.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {fotoKegiatan.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-900 aspect-video"
                  >
                    <img
                      src={photoUrl}
                      alt={`Preview Foto Kegiatan ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2 py-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-white">
                        Foto {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                        title={`Hapus Foto ${idx + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploadingPhoto}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

