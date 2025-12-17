import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { AdminBooking } from "@/lib/api/admin";
import { BookingStatus } from "@/lib/storage";
import WhatsAppButton from "./Whatsappbutton";

type TechnicianOption = {
  id: number;
  name: string;
};

type Props = {
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
  setStatusDraft: React.Dispatch<
    React.SetStateAction<Record<number, BookingStatus>>
  >;

  onStatusSubmit: (id: number) => void;

  /**
   * value sekarang = "unassigned" atau "9" (string id teknisi)
   */
  onTechnicianChange: (id: number, field: "technician", value: string) => void;
};

function formatDateYYYYMMDD(input?: string | Date | null): string {
  if (!input) return "-";

  if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return input;
    return d.toISOString().slice(0, 10);
  }

  const d = input;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

function formatClock(input?: string | Date | null): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatIDR(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
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

  expandedBookingId,
  setExpandedBookingId,

  statusDraft,
  onTechnicianChange,
}) => {
  const toggleExpand = (id: number) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

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
              const isExpanded = expandedBookingId === b.id;

              const photoUrls = [
                b.photos?.arrival,
                b.photos?.before,
                b.photos?.after,
              ].filter(Boolean) as string[];

              return (
                <React.Fragment key={b.id}>
                  <tr className="border-t border-gray-100 dark:border-slate-700">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {b.name}
                      </div>
                      <div className="text-xs text-gray-500">{b.whatsapp}</div>
                    </td>

                    <td className="px-4 py-3">{b.service}</td>

                    <td className="px-4 py-3">
                      {dateText} • {b.time}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={
                          b.technicianUserId == null
                            ? "unassigned"
                            : String(b.technicianUserId)
                        }
                        onChange={(e) =>
                          onTechnicianChange(b.id, "technician", e.target.value)
                        }
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

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <WhatsAppButton booking={b} />

                        <button
                          type="button"
                          onClick={() => toggleExpand(b.id)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                          aria-label={
                            isExpanded ? "Tutup detail" : "Buka detail"
                          }
                          title={isExpanded ? "Tutup detail" : "Buka detail"}
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* DETAIL ROW */}
                  {isExpanded && (
                    <tr className="border-t border-gray-100 dark:border-slate-700">
                      <td
                        colSpan={6}
                        className="px-4 py-4 bg-gray-50/60 dark:bg-slate-900/20"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Detail Pelanggan */}
                          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                            <div className="text-xs font-semibold uppercase text-gray-500 mb-3">
                              Detail Pelanggan
                            </div>

                            <div className="space-y-2 text-sm">
                              <div>
                                <div className="text-xs text-gray-500">
                                  Nama
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {b.name || "-"}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-500">
                                  WhatsApp
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {b.whatsapp || "-"}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-500">
                                  Alamat
                                </div>
                                <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {b.address || "-"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Laporan Kerja */}
                          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                            <div className="text-xs font-semibold uppercase text-gray-500 mb-3">
                              Laporan Kerja
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Tiba
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {b.arrivalTime
                                      ? `${formatDateYYYYMMDD(
                                          b.arrivalTime
                                        )} ${formatClock(b.arrivalTime)}`
                                      : "-"}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-gray-500">
                                    Mulai
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {b.startTime
                                      ? `${formatDateYYYYMMDD(
                                          b.startTime
                                        )} ${formatClock(b.startTime)}`
                                      : "-"}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Selesai
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {b.endTime
                                      ? `${formatDateYYYYMMDD(
                                          b.endTime
                                        )} ${formatClock(b.endTime)}`
                                      : "-"}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-gray-500">
                                    Durasi
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {b.workDurationMinutes != null
                                      ? `${b.workDurationMinutes} mnt`
                                      : "-"}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-gray-500">
                                    Biaya Tambahan
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {formatIDR(b.additionalCosts ?? 0)}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-gray-500">
                                    Teknisi
                                  </div>
                                  <div className="text-gray-900 dark:text-white">
                                    {b.technician || "Belum Ditugaskan"}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-500">
                                  Catatan
                                </div>
                                <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                  {b.note || "-"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bukti Foto */}
                          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                            <div className="text-xs font-semibold uppercase text-gray-500 mb-3">
                              Bukti Foto
                            </div>

                            {photoUrls.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {photoUrls.map((url, idx) => (
                                  <a
                                    key={`${b.id}-photo-${idx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                    title="Klik untuk membuka"
                                  >
                                    <img
                                      src={url}
                                      alt={`Bukti foto ${idx + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-600 hover:opacity-90"
                                      loading="lazy"
                                    />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                Belum ada foto.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {paginatedBookings.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
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
