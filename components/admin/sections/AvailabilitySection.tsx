// components/admin/sections/AvailabilitySection.tsx
import Calendar from '@/components/Calendar';
import { formatDateToKey, parseKeyToDate } from '@/lib/storage';
import React from 'react';

type Props = {
  availableTimes: string[];
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;
  draftFullyBooked: Set<string>;
  draftBookedSlots: Set<string>;
  onToggleFullDay: () => void;
  onToggleSlot: (time: string) => void;
  onRemoveBlockedDate: (dateKey: string) => void;
  hasUnsavedChanges: boolean;
  showSaveSuccess: boolean;
  onSaveChanges: () => void;
};

const AvailabilitySection: React.FC<Props> = ({
  availableTimes,
  selectedDate,
  onSelectedDateChange,
  draftFullyBooked,
  draftBookedSlots,
  onToggleFullDay,
  onToggleSlot,
  onRemoveBlockedDate,
  hasUnsavedChanges,
  showSaveSuccess,
  onSaveChanges,
}) => {
  return (
    <div>
      <div className="sticky top-4 lg:top-20 z-10 flex justify-end items-center mb-4 p-3 bg-light-bg/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg">
        {showSaveSuccess && (
          <span className="text-green-600 font-semibold mr-4">Perubahan berhasil disimpan!</span>
        )}
        <button
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges}
          className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Simpan Perubahan
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
        <div className="col-span-1 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
            Pilih Tanggal
          </h2>
          <p className="text-sm text-secondary dark:text-slate-300 mb-4">
            Pilih tanggal untuk mengatur slot waktu atau memblokir sepanjang hari.
          </p>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={(date) => onSelectedDateChange(date)}
            fullyBookedDates={draftFullyBooked}
          />
        </div>
        <div className="col-span-1 lg:col-span-1 xl:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
            Atur Slot Waktu
          </h2>
          {!selectedDate ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              Pilih tanggal dari kalender untuk memulai.
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-lg text-secondary dark:text-slate-300">
                  {selectedDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <button
                  onClick={onToggleFullDay}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                    draftFullyBooked.has(formatDateToKey(selectedDate))
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {draftFullyBooked.has(formatDateToKey(selectedDate))
                    ? 'Buka Blokir Hari Ini'
                    : 'Blokir Seharian'}
                </button>
              </div>
              <div
                className={`grid grid-cols-3 sm:grid-cols-4 gap-3 ${
                  draftFullyBooked.has(formatDateToKey(selectedDate))
                    ? 'opacity-40 pointer-events-none'
                    : ''
                }`}
              >
                {availableTimes.map((time) => {
                  const slotKey = `${formatDateToKey(selectedDate)}-${time}`;
                  const isBooked = draftBookedSlots.has(slotKey);
                  return (
                    <button
                      key={time}
                      onClick={() => onToggleSlot(time)}
                      className={`text-center font-semibold px-4 py-2.5 rounded-lg border-2 transition-colors duration-200 ${
                        isBooked
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              {draftFullyBooked.has(formatDateToKey(selectedDate)) && (
                <p className="text-center mt-4 text-sm text-red-500 font-medium">
                  Semua slot tidak tersedia karena hari ini diblokir.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-1">
            Daftar Tanggal yang Diblokir Penuh
          </h2>
          <p className="text-sm text-secondary dark:text-slate-300 mb-4">
            Berikut adalah daftar tanggal yang telah Anda tandai sebagai penuh (tidak termasuk slot
            individual).
          </p>
          {Array.from(draftFullyBooked).length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {Array.from<string>(draftFullyBooked)
                .sort((a, b) => parseKeyToDate(a).getTime() - parseKeyToDate(b).getTime())
                .map((dateKey) => (
                  <li
                    key={dateKey}
                    className="flex justify-between items-center bg-light-bg dark:bg-slate-700 p-3 rounded-lg"
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {parseKeyToDate(dateKey).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => onRemoveBlockedDate(dateKey)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              Tidak ada tanggal yang diblokir penuh.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySection;
