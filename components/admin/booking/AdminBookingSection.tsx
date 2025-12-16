// components/admin/bookings/AdminBookingsSection.tsx
import React from 'react';

import { AdminBooking } from '@/lib/api/admin';
import { BookingStatus } from '@/lib/storage';
import WhatsAppButton from './Whatsappbutton';

type TechnicianOption = {
  id: number;
  name: string;
};

type Props = {
  bookings: AdminBooking[];
  filteredBookings: AdminBooking[];
  paginatedBookings: AdminBooking[];
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  technicianFilter: string;
  setTechnicianFilter: (v: string) => void;
  technicians: TechnicianOption[];
  statuses: BookingStatus[];
  expandedBookingId: number | null;
  setExpandedBookingId: (id: number | null) => void;
  statusDraft: Record<number, BookingStatus>;
  setStatusDraft: React.Dispatch<React.SetStateAction<Record<number, BookingStatus>>>;
  onStatusSubmit: (id: number) => void;

  /**
   * value sekarang = "unassigned" atau "9" (string id teknisi)
   */
  onTechnicianChange: (id: number, field: 'technician', value: string) => void;
};

function formatDateYYYYMMDD(input?: string | Date | null): string {
  if (!input) return '-';

  // kalau string ISO: "2025-12-16T17:00:00.000Z" -> ambil 10 char pertama
  if (typeof input === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return input; // fallback kalau bukan format date
    return d.toISOString().slice(0, 10);
  }

  // Date object
  const d = input;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().slice(0, 10);
}

const AdminBookingsSection: React.FC<Props> = ({
  paginatedBookings,
  currentPage,
  totalPages,
  goToPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  technicianFilter,
  setTechnicianFilter,
  technicians,
  statuses,
  statusDraft,
  setStatusDraft,
  onStatusSubmit,
  onTechnicianChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama pelanggan..."
          className="w-full md:w-1/3 rounded-lg border-gray-300 dark:bg-slate-700 dark:border-slate-600"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border-gray-300 dark:bg-slate-700 dark:border-slate-600 text-sm"
          >
            <option value="all">Semua Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="rounded-lg border-gray-300 dark:bg-slate-700 dark:border-slate-600 text-sm"
          >
            <option value="all">Semua Teknisi</option>
            <option value="unassigned">Belum Ditugaskan</option>

            {technicians.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel booking */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Layanan</th>
              <th className="px-4 py-3 text-left">Jadwal</th>
              <th className="px-4 py-3 text-left">Teknisi</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {paginatedBookings.map((b) => {
              const dateText = formatDateYYYYMMDD(b.startDate);

              return (
                <tr key={b.id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.whatsapp}</div>
                  </td>

                  <td className="px-4 py-3">{b.service}</td>

                  <td className="px-4 py-3">
                    {dateText} • {b.time}
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={b.technicianUserId == null ? 'unassigned' : String(b.technicianUserId)}
                      onChange={(e) => onTechnicianChange(b.id, 'technician', e.target.value)}
                      className="rounded-md border-gray-300 dark:bg-slate-700 dark:border-slate-600 text-xs"
                    >
                      <option value="unassigned">Belum Ditugaskan</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={statusDraft[b.id] ?? b.status}
                      disabled
                      className="rounded-md border-gray-300 dark:bg-slate-700 dark:border-slate-600 text-xs opacity-70 cursor-not-allowed"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3 text-right space-x-2">
                    {/* <button
                      onClick={() => onStatusSubmit(b.id)}
                      className="px-3 py-1 text-xs rounded-lg bg-primary text-white"
                    >
                      Update
                    </button> */}
                    <WhatsAppButton booking={b} />
                  </td>
                </tr>
              );
            })}

            {paginatedBookings.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Tidak ada data booking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-xs rounded-lg border disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-xs py-1">
            Halaman {currentPage} dari {totalPages}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-xs rounded-lg border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsSection;
