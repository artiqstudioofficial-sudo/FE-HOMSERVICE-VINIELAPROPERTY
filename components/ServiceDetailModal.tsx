import { CheckCircle, Clock, ShieldCheck, X, XCircle } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Service, serviceIcons } from '../config/services';

interface ServiceDetailModalProps {
  service: Service | null;
  onClose: () => void;
}

const formatDuration = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return 'N/A';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} jam`;
  return `${hours}j ${remainingMinutes}m`;
};

const formatPrice = (price?: number | string): string => {
  const num = typeof price === 'string' ? Number(price) : price ?? 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

type PointJson = {
  includes?: string[];
  excludes?: string[];
};

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose }) => {
  /* -------------------------------------------------------------------------- */
  /*                                   EFFECT                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  /* -------------------------------------------------------------------------- */
  /*                           PARSE POINT (SAFE)                                */
  /* -------------------------------------------------------------------------- */
  const { includes, excludes } = useMemo(() => {
    if (!service) {
      return { includes: [], excludes: [] };
    }

    const rawPoint = (service as any).point;

    // fallback legacy
    const fallbackIncludes = (service as any).includes;
    const fallbackExcludes = (service as any).excludes;

    let parsed: PointJson | null = null;

    if (typeof rawPoint === 'string' && rawPoint.trim()) {
      try {
        parsed = JSON.parse(rawPoint) as PointJson;
      } catch {
        parsed = null;
      }
    }

    const inc =
      (parsed?.includes && Array.isArray(parsed.includes) ? parsed.includes : null) ??
      (Array.isArray(fallbackIncludes) ? fallbackIncludes : []) ??
      [];

    const exc =
      (parsed?.excludes && Array.isArray(parsed.excludes) ? parsed.excludes : null) ??
      (Array.isArray(fallbackExcludes) ? fallbackExcludes : []) ??
      [];

    return {
      includes: inc.filter((x) => typeof x === 'string' && x.trim()),
      excludes: exc.filter((x) => typeof x === 'string' && x.trim()),
    };
  }, [service]);

  /* -------------------------------------------------------------------------- */
  /*                                EARLY RETURN                                */
  /* -------------------------------------------------------------------------- */
  if (!service) return null;

  const iconKey = service.icon as keyof typeof serviceIcons;

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="text-primary">{serviceIcons[iconKey] ?? serviceIcons.Wrench}</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{service.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {service.description && (
            <p className="text-secondary dark:text-slate-300">{service.description}</p>
          )}

          {/* Info */}
          <div className="bg-light-bg dark:bg-slate-900/50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Harga Mulai</p>
              <p className="font-bold text-lg text-primary">
                {formatPrice(service.price)}
                <span className="text-xs font-normal text-secondary">/{service.unit_price}</span>
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Estimasi Durasi</p>
              <p className="font-bold text-lg flex justify-center items-center gap-1.5">
                <Clock size={16} />
                {formatDuration((service as any).duration_minute)}
              </p>
            </div>

            <div className="col-span-2 md:col-span-1">
              <p className="text-sm text-gray-500">Garansi</p>
              <p
                className={`font-bold text-lg flex justify-center items-center gap-1.5 ${
                  service.is_guarantee ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {service.is_guarantee ? (
                  <>
                    <ShieldCheck size={16} /> 30 Hari
                  </>
                ) : (
                  'Tidak Tersedia'
                )}
              </p>
            </div>
          </div>

          {/* Point Detail */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Detail Layanan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Includes */}
              <div>
                <h4 className="font-bold text-lg mb-3">Termasuk Dalam Layanan</h4>
                {includes.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada data.</p>
                ) : (
                  <ul className="space-y-2">
                    {includes.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <CheckCircle size={20} className="text-green-500 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Excludes */}
              <div>
                <h4 className="font-bold text-lg mb-3">Tidak Termasuk</h4>
                {excludes.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada data.</p>
                ) : (
                  <ul className="space-y-2">
                    {excludes.map((item, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <XCircle size={20} className="text-red-500 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <Link
            to={`/contact?service=${encodeURIComponent(service.name)}`}
            className="block text-center bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-primary-dark"
          >
            Pesan Layanan Ini
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
