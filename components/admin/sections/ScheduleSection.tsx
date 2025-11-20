// components/admin/sections/ScheduleSection.tsx
import Calendar from '@/components/Calendar';
import TechnicianSchedule from '@/components/admin/schedule/TechnicianSchedule';
import type { AdminBooking } from '@/lib/api/admin';
import React from 'react';

type TechnicianUser = {
  id: number;
  name: string;
  username: string;
  role: string;
};

type Props = {
  scheduleDate: Date;
  onScheduleDateChange: (date: Date) => void;
  isLoading: boolean;
  error: string | null;
  bookings: AdminBooking[];
  technicians: TechnicianUser[];
};

const ScheduleSection: React.FC<Props> = ({
  scheduleDate,
  onScheduleDateChange,
  isLoading,
  error,
  bookings,
  technicians,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
            Pilih Tanggal
          </h2>
          <p className="text-sm text-secondary dark:text-slate-300 mb-4">
            Pilih tanggal untuk melihat jadwal teknisi dari sistem backend.
          </p>
          <Calendar
            selectedDate={scheduleDate}
            onDateSelect={onScheduleDateChange}
            fullyBookedDates={new Set<string>()}
          />
        </div>
        <div className="lg:col-span-2 space-y-3">
          {isLoading && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-xl p-3 text-sm text-gray-500 dark:text-gray-300">
              Memuat jadwal teknisi untuk{' '}
              {scheduleDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              ...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {error}
            </div>
          )}

          <TechnicianSchedule
            bookings={bookings}
            selectedDate={scheduleDate}
            technicians={technicians}
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleSection;
