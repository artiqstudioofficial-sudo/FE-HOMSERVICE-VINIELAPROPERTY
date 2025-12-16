import React from "react";
import { MapPin } from "lucide-react";
import { Booking } from "@/lib/storage";
import { formatScheduleYYYYMMDD } from "../../components/utils/schedule";

type Props = {
  upcomingJobsFlat: Booking[];
  selectedLocation: { lat: number; lng: number; title: string } | null;
  setSelectedLocation: (
    v: { lat: number; lng: number; title: string } | null
  ) => void;
};

const TechnicianMapSection: React.FC<Props> = ({
  upcomingJobsFlat,
  selectedLocation,
  setSelectedLocation,
}) => {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]"
      data-aos="fade-up"
    >
      <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-4 space-y-3 h-full overflow-y-auto">
        {upcomingJobsFlat.length > 0 ? (
          upcomingJobsFlat.map((job) => (
            <div
              key={job.id}
              className={`w-full p-4 rounded-lg transition-all duration-200 border-l-4 ${
                selectedLocation?.title === job.name
                  ? "bg-primary-light dark:bg-slate-700 border-primary"
                  : "bg-transparent"
              }`}
            >
              <button
                onClick={() =>
                  setSelectedLocation({
                    lat: job.lat,
                    lng: job.lng,
                    title: job.name,
                  })
                }
                className="w-full text-left"
              >
                <p className="font-bold text-gray-800 dark:text-white">
                  {job.name}
                </p>
                <div className="text-sm font-semibold text-primary mt-1">
                  {formatScheduleYYYYMMDD(job.startDate, job.endDate, job.time)}
                </div>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>Tidak ada pekerjaan akan datang.</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col">
        {selectedLocation ? (
          <iframe
            key={`${selectedLocation.lat}-${selectedLocation.lng}`}
            title="Job Location Map"
            className="w-full h-full border-0"
            src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen={false}
            loading="lazy"
          ></iframe>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-6">
            <MapPin
              size={48}
              className="mb-4 text-gray-300 dark:text-gray-600"
            />
            <h3 className="font-bold text-xl">Peta Lokasi Tugas</h3>
            <p>Tidak ada tugas akan datang untuk ditampilkan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianMapSection;
