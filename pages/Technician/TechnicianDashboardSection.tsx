import React from "react";
import { CalendarCheck, CheckCircle, Clock } from "lucide-react";
import { Booking } from "@/lib/storage";

type Props = {
  stats: { today: number; thisWeek: number; completed: number };
  todayJobs: Booking[];
  isLoading: boolean;
};

const TechnicianDashboardSection: React.FC<Props> = ({
  stats,
  todayJobs,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-primary-light p-3 rounded-full">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tugas Hari Ini
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.today}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-primary-light p-3 rounded-full">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tugas Minggu Ini
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.thisWeek}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-primary-light p-3 rounded-full">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Tugas Selesai
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
          Jadwal Hari Ini
        </h2>

        {isLoading ? (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : todayJobs.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg divide-y dark:divide-slate-700">
            {todayJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {job.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {job.service}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{job.time}</p>
                  <p className="text-xs text-gray-400">{job.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada jadwal untuk hari ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboardSection;
