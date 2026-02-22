import React, { useMemo, useState } from 'react';
import { PlusCircle, Settings, Trash2 } from 'lucide-react';
import { ServiceMasterCategory } from '../../../lib/api/admin';

type Props = {
  categories: ServiceMasterCategory[];
  servicesCountByCategoryId?: Record<number, number>;
  onAdd: () => void;
  onEdit: (category: ServiceMasterCategory) => void;
  onRequestDelete: (category: ServiceMasterCategory) => void;
};

const ServiceCategoriesSection: React.FC<Props> = ({
  categories,
  servicesCountByCategoryId = {},
  onAdd,
  onEdit,
  onRequestDelete,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const key = (search || '').toLowerCase();
    return [...categories]
      .filter((c) => (c.name || '').toLowerCase().includes(key))
      .sort((a, b) => b.id - a.id);
  }, [categories, search]);

  return (
    <section className="mb-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Master Kategori Layanan
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full md:w-64 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              <PlusCircle size={20} />
              Tambah Kategori
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-slate-700">
                <th className="py-2 pr-4 text-gray-600 dark:text-gray-300">ID</th>
                <th className="py-2 pr-4 text-gray-600 dark:text-gray-300">Nama</th>
                <th className="py-2 pr-4 text-gray-600 dark:text-gray-300">Dipakai</th>
                <th className="py-2 pr-2 text-gray-600 dark:text-gray-300 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada kategori.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const usedCount = servicesCountByCategoryId[c.id] ?? 0;

                  return (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-slate-700/60">
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">{c.id}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-800 dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-3 pr-4 text-gray-700 dark:text-gray-200">
                        {usedCount} layanan
                      </td>
                      <td className="py-3 pr-2">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEdit(c)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full"
                          >
                            <Settings size={18} />
                          </button>
                          <button
                            onClick={() => onRequestDelete(c)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ServiceCategoriesSection;
