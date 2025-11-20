// components/admin/sections/MapSection.tsx
import type { AdminBooking } from '@/lib/api/admin';
import { ExternalLink, MapPin } from 'lucide-react';
import React from 'react';

type SelectedLocation = { lat: number; lng: number; title: string } | null;

type Props = {
  upcomingJobs: AdminBooking[];
  selectedLocation: SelectedLocation;
  onSelectLocation: (location: SelectedLocation) => void;
};

const MapSection: React.FC<Props> = ({ upcomingJobs, selectedLocation, onSelectLocation }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4 space-y-3 h-full overflow-y-auto">
        <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white p-2 sticky top-0 bg-white dark:bg-slate-800 z-10">
          Pekerjaan Akan Datang
        </h2>
        {upcomingJobs.length > 0 ? (
          upcomingJobs.map((job) => (
            <button
              key={job.id}
              onClick={() =>
                onSelectLocation({
                  lat: job.lat,
                  lng: job.lng,
                  title: job.name,
                })
              }
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-l-4 ${
                selectedLocation?.title === job.name
                  ? 'bg-primary-light dark:bg-slate-700 border-primary'
                  : 'bg-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50 border-transparent'
              }`}
            >
              <p className="font-bold text-gray-800 dark:text-white">{job.name}</p>
              <p className="text-sm text-secondary dark:text-slate-300">{job.service}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{job.address}</p>
              <div className="text-sm font-semibold text-primary mt-2">
                {new Date(job.startDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                - {job.time}
              </div>
            </button>
          ))
        ) : (
          <p className="text-center py-10 text-gray-500 dark:text-gray-400">
            Tidak ada pekerjaan akan datang.
          </p>
        )}
      </div>
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
        {selectedLocation ? (
          <>
            <div className="p-4 border-b dark:border-slate-700 flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                Lokasi: {selectedLocation.title}
              </h3>
              <a
                href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                Buka di Google Maps <ExternalLink size={14} />
              </a>
            </div>
            <iframe
              key={`${selectedLocation.lat}-${selectedLocation.lng}`}
              title="Job Location Map"
              className="w-full h-full border-0"
              src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen={false}
              loading="lazy"
            ></iframe>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-6">
            <MapPin className="mb-4 text-gray-300 dark:text-gray-600" size={48} />
            <h3 className="font-bold text-xl">Peta Lokasi Pekerjaan</h3>
            <p>Pilih pekerjaan dari daftar untuk melihat lokasinya di peta.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSection;
