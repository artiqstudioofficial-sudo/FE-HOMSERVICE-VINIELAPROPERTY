import { Clock, ShieldCheck } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Service, serviceIcons } from '../config/services';
import { fetchServicesFromApi } from '../lib/api/admin';
import ServiceDetailModal from '@/components/admin/modals/ServiceDetailModal';

/* -------------------------------------------------------------------------- */
/*                          TIPE GROUPING KATEGORI                             */
/* -------------------------------------------------------------------------- */

type ServiceCategoryGroup = {
  category: string;
  services: Service[];
};

/* -------------------------------------------------------------------------- */
/*                                   HERO                                     */
/* -------------------------------------------------------------------------- */

const ServicesHero: React.FC = () => (
  <div className="relative bg-primary-dark">
    <div className="absolute inset-0">
      <img
        loading="lazy"
        src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop"
        alt="Layanan Lengkap"
        className="w-full h-full object-cover opacity-30 dark:opacity-40"
      />
    </div>
    <div className="relative container mx-auto px-6 py-32 text-center text-white">
      <h1 className="text-4xl md:text-5xl font-bold font-poppins leading-tight">
        Layanan Lengkap Untuk Semua Kebutuhan Rumah Anda
      </h1>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const formatDuration = (minutes?: number | null): string => {
  if (!minutes || minutes <= 0) return 'N/A';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours}j ${remainingMinutes}m`;
};

const formatPrice = (price: number | string): string => {
  const num = typeof price === 'string' ? Number(price) || 0 : price;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/* -------------------------------------------------------------------------- */
/*                          ALL SERVICES + SEARCH LOKAL                        */
/* -------------------------------------------------------------------------- */

const AllServicesSection: React.FC = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // raw data dari API (flat)
  const [rawServices, setRawServices] = useState<Service[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchServicesFromApi();
        setRawServices(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Gagal memuat data layanan');
        setRawServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  /* -------------------------- SEARCH BLOB BUILDER -------------------------- */
  const buildSearchBlob = (s: Service) => {
    const pointAny: any = (s as any).point;

    let includes: string[] = [];
    let excludes: string[] = [];

    try {
      if (typeof pointAny === 'string') {
        const j = JSON.parse(pointAny);
        includes = Array.isArray(j?.includes) ? j.includes.map(String) : [];
        excludes = Array.isArray(j?.excludes) ? j.excludes.map(String) : [];
      } else if (typeof pointAny === 'object' && pointAny) {
        includes = Array.isArray(pointAny?.includes) ? pointAny.includes.map(String) : [];
        excludes = Array.isArray(pointAny?.excludes) ? pointAny.excludes.map(String) : [];
      }
    } catch {
      if (typeof pointAny === 'string') includes = [pointAny];
    }

    return [
      s.name,
      s.category,
      s.unit_price,
      s.price,
      (s as any).duration_minute,
      (s as any).duration_hour,
      (s as any).is_guarantee,
      (s as any).icon,
      ...includes,
      ...excludes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  };

  /* ----------------------------- FILTER RESULT ----------------------------- */
  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rawServices;

    const terms = q.split(/\s+/).filter(Boolean);

    return rawServices.filter((s) => {
      const blob = buildSearchBlob(s);
      return terms.every((t) => blob.includes(t));
    });
  }, [rawServices, query]);

  /* --------------------------- GROUP BY CATEGORY ---------------------------- */
  const groupedServices: ServiceCategoryGroup[] = useMemo(() => {
    const map: Record<string, Service[]> = {};
    filteredServices.forEach((s) => {
      const cat = s.category || 'Lainnya';
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });

    return Object.entries(map).map(([category, services]) => ({
      category,
      services,
    }));
  }, [filteredServices]);

  return (
    <section className="py-24 bg-light-bg dark:bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold font-poppins text-gray-800 dark:text-white">
            Semua Layanan Kami
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-secondary dark:text-slate-300 mt-4">
            Cari berdasarkan nama layanan, kategori, harga, durasi, garansi, atau detail lainnya.
          </p>
        </div>

        {/* SEARCH */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari layanan (contoh: AC, garansi, 1 jam, plumbing, murah...)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 pr-24 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {query
              ? `Menampilkan ${filteredServices.length} dari ${rawServices.length} layanan`
              : `Total layanan: ${rawServices.length}`}
          </div>
        </div>

        {/* STATE */}
        {isLoading && <div className="text-center">Memuat layanan...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!isLoading && !error && rawServices.length === 0 && (
          <div className="text-center">Belum ada layanan.</div>
        )}
        {!isLoading && !error && rawServices.length > 0 && filteredServices.length === 0 && (
          <div className="text-center">
            Tidak ada layanan yang cocok dengan pencarian <b>{query}</b>
          </div>
        )}

        {/* RENDER */}
        {!isLoading &&
          !error &&
          groupedServices.map((group, idx) => (
            <div key={group.category} className={idx ? 'mt-16' : ''}>
              <h3 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">
                {group.category}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {group.services.map((service, i) => (
                  <button
                    key={service.id ?? i}
                    onClick={() => setSelectedService(service)}
                    className="group relative bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg hover:-translate-y-2 transition-all"
                  >
                    {Number(service.is_guarantee) === 1 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        <ShieldCheck size={14} />
                        Garansi
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                      <div className="text-primary mb-4">
                        {serviceIcons[service.icon] || serviceIcons['Wrench']}
                      </div>
                      <h4 className="font-semibold mb-2">{service.name}</h4>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        Estimasi {formatDuration(parseInt(service.duration_minute) ?? 0)}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-400">Mulai dari</p>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(service.price)}
                        <span className="text-sm font-normal">/{service.unit_price || 'unit'}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

        <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                             PRICING INFO                                   */
/* -------------------------------------------------------------------------- */

const PricingInfoSection: React.FC = () => (
  <section className="py-24 bg-white dark:bg-dark-bg">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold mb-6">Harga Transparan & Terjangkau</h2>
      <Link to="/contact" className="bg-primary text-white px-8 py-3 rounded-full font-bold">
        Dapatkan Estimasi Biaya
      </Link>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/*                                   FAQ                                      */
/* -------------------------------------------------------------------------- */

const FaqSection: React.FC = () => (
  <section className="py-24 bg-light-bg dark:bg-slate-900">
    <div className="container mx-auto px-6 max-w-4xl text-center">
      <h2 className="text-3xl font-bold mb-8">Pertanyaan Umum</h2>
      <p className="text-secondary dark:text-slate-300">
        Hubungi kami jika masih ada pertanyaan terkait layanan.
      </p>
    </div>
  </section>
);

/* -------------------------------------------------------------------------- */
/*                                MAIN EXPORT                                 */
/* -------------------------------------------------------------------------- */

const ServicesPage: React.FC = () => {
  return (
    <>
      <ServicesHero />
      <AllServicesSection />
      <PricingInfoSection />
      <FaqSection />
    </>
  );
};

export default ServicesPage;
