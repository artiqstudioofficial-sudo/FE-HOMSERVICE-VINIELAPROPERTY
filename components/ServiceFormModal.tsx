// ../components/ServiceFormModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Service } from "../config/services";
import { ServiceMasterCategory } from "../lib/api/admin";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // param ke-2 sekarang akan berisi ID kategori (dalam bentuk string)
  onSave: (serviceData: Service, categoryValue: string) => void;
  serviceToEdit: Service | null;
  categoryToEdit: string | null;
  allCategories: string[];
  serviceCategories: ServiceMasterCategory[];
};

const UNIT_OPTIONS: Service["unit_price"][] = ["unit", "jam", "kg", "m²"];

const ServiceFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  serviceToEdit,
  categoryToEdit,
  allCategories,
  serviceCategories,
}) => {
  const isEdit = !!serviceToEdit;

  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<Service["unit_price"]>("unit");

  // ⬇️ ini ID kategori (string), dikirim ke select.value
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // label kategori untuk ditaruh di field Service.category (dipakai di UI)
  const [categoryLabel, setCategoryLabel] = useState<string>("");

  const [durationMinute, setDurationMinute] = useState<string>("");
  const [durationHour, setDurationHour] = useState<string>("");
  const [isGuarantee, setIsGuarantee] = useState(false);
  const [point, setPoint] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // List kategori dari master API → dipakai untuk select
  const categoryOptions = useMemo(() => serviceCategories, [serviceCategories]);

  useEffect(() => {
    if (!isOpen) return;

    if (serviceToEdit) {
      setName(serviceToEdit.name ?? "");
      setPrice(
        typeof serviceToEdit.price === "number"
          ? String(serviceToEdit.price)
          : serviceToEdit.price ?? ""
      );
      setUnitPrice(
        (serviceToEdit.unit_price as Service["unit_price"]) || "unit"
      );

      // ID kategori dari backend
      if (serviceToEdit.service_category) {
        setSelectedCategoryId(String(serviceToEdit.service_category));
      } else {
        setSelectedCategoryId("");
      }

      // label kategori (fallback dari categoryToEdit atau dari serviceToEdit.category)
      setCategoryLabel(categoryToEdit || serviceToEdit.category || "");

      const dm = (serviceToEdit as any).duration_minute;
      const dh = (serviceToEdit as any).duration_hour;
      setDurationMinute(typeof dm === "number" && dm > 0 ? String(dm) : "");
      setDurationHour(typeof dh === "number" && dh > 0 ? String(dh) : "");

      const p = (serviceToEdit as any).point;
      setPoint(typeof p === "number" ? String(p) : "");

      const ig = (serviceToEdit as any).is_guarantee;
      setIsGuarantee(Boolean(ig));
    } else {
      setName("");
      setPrice("");
      setUnitPrice("unit");
      setSelectedCategoryId("");
      setCategoryLabel("");
      setDurationMinute("");
      setDurationHour("");
      setIsGuarantee(false);
      setPoint("");
    }
  }, [isOpen, serviceToEdit, categoryToEdit]);

  const handleChangeSelectCategory = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value; // ini ID kategori (string)
    setSelectedCategoryId(value);

    const idNum = Number(value);
    const master = serviceCategories.find((c) => c.id === idNum);
    if (master) {
      setCategoryLabel(master.name);
    }
  };

  const handleChangeCustomCategory = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const v = e.target.value;
    setCategoryLabel(v);
    // kalau user override manual, kita biarkan id tetap apapun (boleh kosong)
    if (!v) {
      // kalau kosong, boleh reset id juga
      setSelectedCategoryId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!price.trim()) return;
    if (!categoryLabel.trim()) return; // minimal label harus ada

    setIsSubmitting(true);
    try {
      const categoryIdNum = selectedCategoryId
        ? Number(selectedCategoryId)
        : serviceToEdit?.service_category ?? 0;

      const base: Service = {
        ...(serviceToEdit ? { id: serviceToEdit.id } : {}),
        id: serviceToEdit.id,
        name: name.trim(),
        price: price.trim(),
        unit_price: unitPrice,
        service_category: categoryIdNum, // ⬅️ ID kategori
        category: categoryLabel.trim(), // ⬅️ label untuk UI
      };

      const withExtra = {
        ...base,
        duration_minute: durationMinute ? Number(durationMinute) : undefined,
        duration_hour: durationHour ? Number(durationHour) : undefined,
        point: point ? Number(point) : undefined,
        is_guarantee: isGuarantee,
      } as Service;

      // param kedua: kirim ID kategori (string) → akan di-parse di AdminPage
      onSave(withExtra, selectedCategoryId);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? "Edit Layanan" : "Tambah Layanan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Harga (IDR)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Contoh: 150000"
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
                onChange={(e) =>
                  setUnitPrice(e.target.value as Service["unit_price"])
                }
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategori (ID sebagai value) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Kategori Layanan
            </label>

            <select
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary mb-2"
              value={selectedCategoryId}
              onChange={handleChangeSelectCategory}
            >
              <option value="">-- Pilih kategori --</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* optional: override nama kategori untuk UI */}
            <input
              type="text"
              className="w-full rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Label kategori untuk tampilan (opsional)"
              value={categoryLabel}
              onChange={handleChangeCustomCategory}
            />
          </div>

          {/* Durasi & Point */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="Contoh: 60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Durasi (jam)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={durationHour}
                onChange={(e) => setDurationHour(e.target.value)}
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Point
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={point}
                onChange={(e) => setPoint(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>

          {/* Garansi */}
          <div className="flex items-center gap-2">
            <input
              id="isGuarantee"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              checked={isGuarantee}
              onChange={(e) => setIsGuarantee(e.target.checked)}
            />
            <label
              htmlFor="isGuarantee"
              className="text-sm text-slate-700 dark:text-slate-200"
            >
              Layanan bergaransi
            </label>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
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
              {isSubmitting
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Tambah Layanan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormModal;
