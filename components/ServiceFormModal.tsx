import { Plus, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Service } from '../config/services';
import { ServiceMasterCategory } from '../lib/api/admin';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: Service, categoryValue: string) => void;
  serviceToEdit: Service | null;
  categoryToEdit: string | null;
  allCategories: string[];
  serviceCategories: ServiceMasterCategory[];
};

type UnitPrice = 'unit' | 'jam' | 'kg' | 'm²';
const UNIT_OPTIONS: UnitPrice[] = ['unit', 'jam', 'kg', 'm²'];

type PointPayload = { includes: string[]; excludes: string[] };

function parsePoint(pointRaw: any): PointPayload {
  const empty: PointPayload = { includes: [], excludes: [] };
  if (!pointRaw) return empty;

  if (typeof pointRaw === 'object') {
    return {
      includes: Array.isArray(pointRaw.includes) ? pointRaw.includes.map(String) : [],
      excludes: Array.isArray(pointRaw.excludes) ? pointRaw.excludes.map(String) : [],
    };
  }

  if (typeof pointRaw === 'string') {
    const s = pointRaw.trim();
    if (!s) return empty;

    try {
      const j = JSON.parse(s);
      return {
        includes: Array.isArray(j?.includes) ? j.includes.map(String) : [],
        excludes: Array.isArray(j?.excludes) ? j.excludes.map(String) : [],
      };
    } catch {
      return { includes: [s], excludes: [] };
    }
  }

  return empty;
}

function uniqClean(arr: string[]) {
  const clean = arr.map((x) => (x ?? '').trim()).filter(Boolean);
  return Array.from(new Set(clean));
}

const ServiceFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  serviceToEdit,
  categoryToEdit,
  serviceCategories,
}) => {
  const isEdit = !!serviceToEdit;

  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<UnitPrice>('unit');

  // ✅ ADD: kategori manual ketik (nama)
  const [categoryLabel, setCategoryLabel] = useState<string>('');

  // ✅ EDIT: kategori wajib pilih existing (id)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [durationMinute, setDurationMinute] = useState<string>('');
  const [durationHour, setDurationHour] = useState<string>('');
  const [isGuarantee, setIsGuarantee] = useState(false);

  const [includes, setIncludes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);
  const [includeInput, setIncludeInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = useMemo(() => serviceCategories, [serviceCategories]);

  // ✅ suggestion untuk input kategori (ADD only)
  const categoryNameSuggestions = useMemo(() => {
    return uniqClean(serviceCategories.map((c) => String(c.name)));
  }, [serviceCategories]);

  // ✅ biar init form cuma sekali per "sesi edit/add"
  const hydratedKeyRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const key = serviceToEdit ? `edit:${serviceToEdit.id}` : 'add:new';
    if (hydratedKeyRef.current === key) return;

    hydratedKeyRef.current = key;

    if (serviceToEdit) {
      setName(serviceToEdit.name ?? '');
      setPrice(
        typeof serviceToEdit.price === 'number'
          ? String(serviceToEdit.price)
          : ((serviceToEdit.price as any) ?? ''),
      );
      setUnitPrice((serviceToEdit.unit_price as UnitPrice) || 'unit');

      // ✅ EDIT: set kategori id existing
      const existingCatId = serviceToEdit.service_category
        ? String(serviceToEdit.service_category)
        : '';
      setSelectedCategoryId(existingCatId);

      // ✅ untuk display (nama)
      setCategoryLabel(categoryToEdit || serviceToEdit.category || '');

      const dm: any = (serviceToEdit as any).duration_minute;
      const dh: any = (serviceToEdit as any).duration_hour;
      setDurationMinute(dm != null && String(dm) !== '0' ? String(dm) : '');
      setDurationHour(dh != null && String(dh) !== '0' ? String(dh) : '');

      const ig: any = (serviceToEdit as any).is_guarantee;
      setIsGuarantee(Boolean(Number(ig ?? 0)));

      const pointRaw: any = (serviceToEdit as any).point;
      const parsed = parsePoint(pointRaw);
      setIncludes(parsed.includes);
      setExcludes(parsed.excludes);

      setIncludeInput('');
      setExcludeInput('');
    } else {
      // ADD
      setName('');
      setPrice('');
      setUnitPrice('unit');

      setCategoryLabel('');
      setSelectedCategoryId('');

      setDurationMinute('');
      setDurationHour('');
      setIsGuarantee(false);

      setIncludes([]);
      setExcludes([]);
      setIncludeInput('');
      setExcludeInput('');
    }
  }, [isOpen, serviceToEdit, categoryToEdit]);

  useEffect(() => {
    const key = serviceToEdit ? `edit:${serviceToEdit.id}` : 'add:new';
    if (hydratedKeyRef.current && hydratedKeyRef.current !== key) {
      hydratedKeyRef.current = '';
    }
  }, [serviceToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // ✅ EDIT: saat pilih kategori existing, update juga labelnya (nama)
  const handleChangeSelectCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategoryId(value);

    const idNum = Number(value);
    const master = serviceCategories.find((c) => c.id === idNum);
    if (master) setCategoryLabel(master.name);
  };

  // ✅ ADD: manual ketik
  const handleChangeCategoryLabel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryLabel(e.target.value);
  };

  const addInclude = () => {
    const v = includeInput.trim();
    if (!v) return;
    setIncludes((prev) => uniqClean([...prev, v]));
    setIncludeInput('');
  };

  const addExclude = () => {
    const v = excludeInput.trim();
    if (!v) return;
    setExcludes((prev) => uniqClean([...prev, v]));
    setExcludeInput('');
  };

  const removeInclude = (idx: number) => {
    setIncludes((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExclude = (idx: number) => {
    setExcludes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!price.trim()) return;

    // ✅ validasi kategori:
    // - ADD: wajib isi categoryLabel (nama)
    // - EDIT: wajib pilih kategori existing (id)
    if (!isEdit && !categoryLabel.trim()) return;
    if (isEdit && !selectedCategoryId) return;

    setIsSubmitting(true);
    try {
      const categoryIdNum = isEdit ? Number(selectedCategoryId) : 0;

      const pointJson = JSON.stringify({
        includes: uniqClean(includes),
        excludes: uniqClean(excludes),
      } satisfies PointPayload);

      const payload = {
        id: serviceToEdit?.id ?? 0,
        name: name.trim(),
        price: price.trim(),
        unit_price: unitPrice,
        service_category: categoryIdNum, // ✅ EDIT: id existing; ADD: 0
        category: categoryLabel.trim(), // ✅ display nama kategori
        duration_minute: durationMinute.trim() || '',
        duration_hour: durationHour.trim() || '',
        is_guarantee: isGuarantee,
        icon: '',
        point: pointJson,
      } as Service;

      // ✅ penting:
      // - ADD: kirim nama kategori (backend boleh create/find)
      // - EDIT: kirim kosong (backend jangan create kategori baru)
      const categoryValue = isEdit ? '' : categoryLabel.trim();

      onSave(payload, categoryValue);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!isOpen}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Edit Layanan' : 'Tambah Layanan Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Nama Layanan
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Cuci AC 1 PK"
              required
            />
          </div>

          {/* Harga & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Harga
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Satuan Harga
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value as UnitPrice)}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <input
                id="isGuarantee"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                checked={isGuarantee}
                onChange={(e) => setIsGuarantee(e.target.checked)}
              />
              <label htmlFor="isGuarantee" className="text-sm text-slate-700 dark:text-slate-200">
                Bergaransi
              </label>
            </div>
          </div>

          {/* ✅ Kategori */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Kategori
            </label>

            {isEdit ? (
              <>
                {/* EDIT: pilih existing */}
                <select
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedCategoryId}
                  onChange={handleChangeSelectCategory}
                  required
                >
                  <option value="">-- Pilih kategori --</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Edit mode: hanya bisa pilih kategori yang sudah ada (tidak membuat kategori baru).
                </p>
              </>
            ) : (
              <>
                {/* ADD: manual ketik */}
                <input
                  type="text"
                  list="service-category-suggestions"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ketik kategori... (contoh: AC, Elektronik, Plumbing)"
                  value={categoryLabel}
                  onChange={handleChangeCategoryLabel}
                  required
                />
                <datalist id="service-category-suggestions">
                  {categoryNameSuggestions.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>

                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Tambah mode: kamu bisa ketik kategori baru. List hanya sebagai suggestion.
                </p>
              </>
            )}
          </div>

          {/* Durasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Durasi (menit)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={durationMinute}
                onChange={(e) => setDurationMinute(e.target.value)}
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Durasi (hari/jam)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={durationHour}
                onChange={(e) => setDurationHour(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {/* POINT SECTION (tetap) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Termasuk */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Termasuk
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tambahkan poin..."
                  value={includeInput}
                  onChange={(e) => setIncludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInclude();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addInclude}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark"
                  aria-label="Tambah poin termasuk"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {includes.map((it, idx) => (
                  <div
                    key={`${it}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-200">{it}</span>
                    <button
                      type="button"
                      onClick={() => removeInclude(idx)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Hapus poin"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tidak Termasuk */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Tidak Termasuk
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tambahkan poin..."
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExclude();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addExclude}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark"
                  aria-label="Tambah poin tidak termasuk"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {excludes.map((it, idx) => (
                  <div
                    key={`${it}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-200">{it}</span>
                    <button
                      type="button"
                      onClick={() => removeExclude(idx)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Hapus poin"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Layanan' : 'Tambah Layanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormModal;
