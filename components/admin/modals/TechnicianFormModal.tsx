// components/admin/modals/TechnicianFormModal.tsx
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

type TechnicianFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (technician: any) => void | Promise<void>;
  technicianToEdit: any;
  existingUsernames: string[];
  roles: { id: number; name: string }[];
};

const TechnicianFormModal: React.FC<TechnicianFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  technicianToEdit,
  existingUsernames,
  roles,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      const defaultRole =
        technicianToEdit?.role ||
        roles.find((r) => r.name === "technician")?.name ||
        roles[0]?.name ||
        "";

      setFormData(
        technicianToEdit
          ? { ...technicianToEdit, password: "" }
          : { name: "", username: "", role: defaultRole, password: "" },
      );
      setErrors({});
    }
  }, [isOpen, technicianToEdit, roles]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name?.trim()) newErrors.name = "Nama wajib diisi.";
    if (!formData.username?.trim())
      newErrors.username = "Username wajib diisi.";
    if (!formData.role?.trim()) newErrors.role = "Peran wajib diisi.";

    if (!technicianToEdit) {
      if (!formData.password?.trim())
        newErrors.password = "Password wajib diisi untuk user baru.";
      if (existingUsernames.includes(formData.username!.trim())) {
        newErrors.username = "Username sudah digunakan.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...(formData as any) });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
              {technicianToEdit ? "Edit User" : "Tambah User Baru"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username || ""}
                  onChange={handleChange}
                  readOnly={!!technicianToEdit}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary read-only:bg-gray-100 dark:read-only:bg-slate-600"
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role User
                </label>
                <select
                  name="role"
                  value={formData.role || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                >
                  <option value="">Pilih role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              {technicianToEdit && (
                <p className="text-xs text-gray-400 mt-1">
                  Kosongkan jika tidak ingin mengubah password.
                </p>
              )}
            </div>
          </div>

          <div className="p-6 bg-light-bg dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200 font-bold px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-5 00"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TechnicianFormModal;
