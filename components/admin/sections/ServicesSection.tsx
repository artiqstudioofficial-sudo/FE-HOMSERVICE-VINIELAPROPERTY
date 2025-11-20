// components/admin/sections/ServicesSection.tsx
import { Service, ServiceCategory, serviceIcons } from '@/config/services';
import { PlusCircle, Settings } from 'lucide-react';
import React from 'react';

type Props = {
  services: ServiceCategory[];
  onAddService: () => void;
  onEditService: (service: Service, categoryName: string) => void;
  onRequestDelete: (payload: { serviceName: string; categoryName: string } | null) => void;
};

const ServicesSection: React.FC<Props> = ({
  services,
  onAddService,
  onEditService,
  onRequestDelete,
}) => {
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
      <div className="space-y-8">
        {services.map((category) => (
          <div
            key={category.category}
            className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
              {category.category}
            </h3>
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {category.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-4">
                    <div className="text-primary hidden sm:block">
                      {serviceIcons[service.icon] || serviceIcons['Wrench']}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Rp{service.price.toLocaleString('id-ID')} / {service.priceUnit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditService(service, category.category)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full"
                      title="Edit Layanan"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() =>
                        onRequestDelete({
                          serviceName: service.name,
                          categoryName: category.category,
                        })
                      }
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full"
                      title="Hapus Layanan"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesSection;
