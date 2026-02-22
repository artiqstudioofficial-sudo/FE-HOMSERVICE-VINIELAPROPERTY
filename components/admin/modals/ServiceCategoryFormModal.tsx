import React, { useEffect, useMemo, useState } from 'react';
import GenericConfirmationModal from '../../GenericConfirmationModal';

export type ServiceCategoryFormValue = {
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: ServiceCategoryFormValue) => void;
  categoryToEdit?: { id: number; name: string } | null;
  existingNames?: string[];
};

const ServiceCategoryFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  existingNames = [],
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!categoryToEdit;

  useEffect(() => {
    if (!isOpen) return;

    setName(categoryToEdit?.name ?? '');
    setError(null); // reset error setiap modal dibuka
  }, [isOpen, categoryToEdit]);

  const normalizedExisting = useMemo(
    () => new Set(existingNames.map((n) => (n || '').trim().toLowerCase())),
    [existingNames],
  );

  const validate = (rawName: string): string | null => {
    const n = (rawName || '').trim();
    if (!n) return 'Nama kategori wajib diisi.';
    if (n.length < 2) return 'Nama kategori minimal 2 karakter.';

    const lower = n.toLowerCase();
    const currentLower = (categoryToEdit?.name || '').trim().toLowerCase();

    const isDuplicate =
      normalizedExisting.has(lower) && (!isEdit || (isEdit && lower !== currentLower));

    if (isDuplicate) return 'Nama kategori sudah ada.';
    return null;
  };

  const handleSubmit = () => {
    const validationError = validate(name);
    setError(validationError);

    if (validationError) return;

    onSave({ name: (name || '').trim() });
  };

  return (
    <GenericConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={isEdit ? 'Edit Kategori Layanan' : 'Tambah Kategori Layanan'}
      confirmText={isEdit ? 'Simpan Perubahan' : 'Tambah'}
      confirmButtonClass="bg-primary hover:bg-primary-dark focus:ring-primary"
    >
      <div className="space-y-3">
        <div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // tidak memvalidasi saat mengetik; hanya reset error jika ada
              if (error) setError(null);
            }}
            placeholder="Contoh: AC, Cleaning, Plumbing..."
            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </GenericConfirmationModal>
  );
};

export default ServiceCategoryFormModal;
