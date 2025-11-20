// components/admin/sections/ServicesSection.tsx
import { Service, ServiceCategory } from "@/config/services";
import { PlusCircle, Settings, Trash2 } from "lucide-react";
import React, { useMemo } from "react";

type Props = {
  // daftar layanan flat dari API
  services: Service[];
  // kalau mau dipakai nanti (misal dropdown), tetap bisa dikirim
  categories?: ServiceCategory[];
  onAddService: () => void;
  onEditService: (service: Service, categoryName: string) => void;
  onRequestDelete: (
    payload: {
      serviceId: number;
      serviceName: string;
      categoryName: string;
    } | null
  ) => void;
};

type GroupedCategory = {
  categoryName: string;
  services: Service[];
};

const ServicesSection: React.FC<Props> = ({
  services,
  onAddService,
  onEditService,
  onRequestDelete,
}) => {
  // Group service berdasarkan nama kategori (field service.category)
  const grouped = useMemo<GroupedCategory[]>(() => {
    const map = new Map<string, Service[]>();

    services.forEach((service) => {
      const categoryName = service.category || "Layanan Umum";

      if (!map.has(categoryName)) {
        map.set(categoryName, []);
      }
      map.get(categoryName)!.push(service);
    });

    // optional: sort kategori by name
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([categoryName, services]) => ({ categoryName, services }));
  }, [services]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
          Manajemen Layanan
        </h2>
        <button
          onClick={onAddService}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <PlusCircle size={20} />
          Tambah Layanan
        </button>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 text-center text-gray-500 dark:text-gray-400">
          Belum ada layanan. Silakan tambah layanan baru.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((category) => (
            <div
              key={category.categoryName}
              className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
                {category.categoryName}
              </h3>

              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {category.services.map((service) => {
                  const priceNumber = Number(service.price) || 0;

                  return (
                    <div
                      key={service.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-4">
                        {/* Ikon bisa disesuaikan nanti, untuk sekarang default bulatan */}
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center text-primary text-sm font-bold uppercase">
                          {service.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {service.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Rp{priceNumber.toLocaleString("id-ID")} /{" "}
                            {service.unit_price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onEditService(service, category.categoryName)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full"
                          title="Edit Layanan"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() =>
                            onRequestDelete({
                              serviceId: service.id,
                              serviceName: service.name,
                              categoryName: category.categoryName,
                            })
                          }
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full"
                          title="Hapus Layanan"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesSection;
