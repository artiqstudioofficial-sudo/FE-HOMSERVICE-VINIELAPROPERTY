import React, { useMemo, useRef, useState } from "react";
import GenericConfirmationModal from "@/components/GenericConfirmationModal";
import { useNotification } from "@/contexts/NotificationContext";
import { simulateNotification } from "@/lib/notifications";

import {
  Booking,
  BookingStatus,
  resolveAssetUrl,
  uploadBookingPhoto,
} from "@/lib/storage";
import PhotoUpload from "./PhotoUpload";

/* -------------------------------------------------------------------------- */
/*                         STATUS MAPPING (UI -> API)                          */
/* -------------------------------------------------------------------------- */

const BOOKING_STATUS_TO_API_CODE: Record<BookingStatus, number> = {
  Confirmed: 1,
  "On Site": 2,
  "In Progress": 3,
  Completed: 4,
  Cancelled: 5,
};

async function updateBookingStatusOnServer(
  formId: number,
  status: BookingStatus,
  userId: number,
  patch: Partial<Booking>
) {
  const statusCode =
    BOOKING_STATUS_TO_API_CODE[status] ?? BOOKING_STATUS_TO_API_CODE.Confirmed;

  const base =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    "https://api-homeservice.viniela.id";

  const res = await fetch(`${base}/api/v1/admin/update-booking-status`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form_id: formId,
      user_id: userId,
      arrival_time: patch.arrival_time,
      start_time: patch.start_time,
      end_time: patch.end_time,
      work_duration_minutes: patch.work_duration_minutes,
      note: patch.note,
      additional_cost: patch.additional_cost,
      status: statusCode,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      `Gagal update status (status ${res.status})`;
    throw new Error(msg);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   JOB CARD                                  */
/* -------------------------------------------------------------------------- */

const JobCard: React.FC<{
  booking: Booking;
  currentTechnicianId: number;
  onBookingUpdateLocal: (updated: Booking) => void;
  onRefresh: () => Promise<void>;
}> = ({ booking, currentTechnicianId, onBookingUpdateLocal, onRefresh }) => {
  const { addNotification } = useNotification();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(booking.startDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(booking.endDate);
  endDate.setHours(0, 0, 0, 0);

  const isMultiDay = startDate.getTime() !== endDate.getTime();
  const isJobActiveToday = today >= startDate && today <= endDate;
  const isStartDate = today.getTime() === startDate.getTime();
  const isEndDate = today.getTime() === endDate.getTime();

  const [isCompleting, setIsCompleting] = useState(false);
  const [isConfirmingComplete, setIsConfirmingComplete] = useState(false);

  const [additionalWorkNotes, setAdditionalWorkNotes] = useState(
    booking.note || ""
  );
  const [additionalCosts, setAdditionalCosts] = useState(
    booking.additionalCosts || 0
  );
  const [displayCosts, setDisplayCosts] = useState(() =>
    (booking.additionalCosts || 0).toString() === "0"
      ? "0"
      : new Intl.NumberFormat("id-ID").format(booking.additionalCosts || 0)
  );

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAdditionalCosts(0);
      setDisplayCosts("");
      return;
    }
    const numericValue = parseInt(value.replace(/\./g, ""), 10);
    if (!isNaN(numericValue)) {
      setAdditionalCosts(numericValue);
      setDisplayCosts(new Intl.NumberFormat("id-ID").format(numericValue));
    }
  };

  const handleCostBlur = () => {
    if (displayCosts === "") setDisplayCosts("0");
  };

  const getFormId = () => {
    const formId = (booking as any).formId ?? (booking as any).form_id ?? null;
    if (!formId)
      throw new Error(
        "form_id tidak ditemukan pada booking (cek mapping API)."
      );
    return Number(formId);
  };

  const pushStatusToServer = async (
    nextStatus: BookingStatus,
    patch?: Partial<Booking>
  ) => {
    const formId = getFormId();

    if (!formId) throw new Error("booking.id tidak valid untuk form_id.");

    await updateBookingStatusOnServer(
      formId,
      nextStatus,
      currentTechnicianId,
      patch
    );

    const updated: Booking = { ...booking, ...patch, status: nextStatus };
    onBookingUpdateLocal(updated);

    await onRefresh();
  };

  const handleStatusUpdate = async (status: BookingStatus) => {
    const nowIso = new Date().toISOString();

    try {
      if (status === "On Site") {
        const uiMessage = simulateNotification("technician_on_the_way", {
          ...booking,
          status,
          arrivalTime: nowIso,
        });
        addNotification(uiMessage, "info");
        await pushStatusToServer(status, { arrival_time: nowIso });
        return;
      }

      if (status === "In Progress") {
        await pushStatusToServer(status, { start_time: nowIso });
        return;
      }

      await pushStatusToServer(status);
    } catch (err: any) {
      console.error(err);
      addNotification(
        err?.message || "Gagal update status di server.",
        "error"
      );
    }
  };

  const handlePhotoUpload = async (
    type: "arrival" | "before" | "after",
    file: File
  ) => {
    const formId = getFormId();

    if (!formId) throw new Error("booking.id tidak valid untuk form_id.");

    const result = await uploadBookingPhoto(formId, type, file);
    const url = result?.url;

    const updated: Booking = {
      ...booking,
      photos: { ...(booking.photos || {}), [type]: url },
    };
    onBookingUpdateLocal(updated);

    await onRefresh();
  };

  const executeCompleteJob = async () => {
    try {
      const now = new Date();
      const startIso = booking.startTime || new Date().toISOString();
      const startTime = new Date(startIso);
      const duration = Math.round(
        (now.getTime() - startTime.getTime()) / 60000
      );

      await pushStatusToServer("Completed", {
        end_time: now.toISOString(),
        work_duration_minutes: duration > 0 ? String(duration) : String(0),
        note: additionalWorkNotes,
        additional_cost: additionalCosts,
      });

      const uiMessage = simulateNotification("job_completed", {
        ...booking,
        status: "Completed",
      } as any);
      addNotification(uiMessage, "success");

      setIsCompleting(false);
      setIsConfirmingComplete(false);
    } catch (err: any) {
      console.error(err);
      addNotification(
        err?.message || "Gagal menyelesaikan pekerjaan.",
        "error"
      );
    }
  };

  const formatSchedule = () => {
    const start = startDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!isMultiDay) return `${start} - ${booking.time}`;
    const end = endDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return `${start} s/d ${end}`;
  };

  const renderAction = () => {
    if (
      !isJobActiveToday &&
      booking.status !== "Completed" &&
      booking.status !== "Cancelled"
    ) {
      return (
        <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
          <p className="font-semibold text-gray-500 dark:text-gray-400">
            Tugas belum dimulai.
          </p>
        </div>
      );
    }

    switch (booking.status) {
      case "Confirmed":
        if (!isStartDate) {
          return (
            <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
              <p className="font-semibold text-gray-500 dark:text-gray-400">
                Tugas dimulai pada {startDate.toLocaleDateString("id-ID")}
              </p>
            </div>
          );
        }
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700">
            <button
              onClick={() => handleStatusUpdate("On Site")}
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Saya Sudah di Lokasi
            </button>
          </div>
        );

      case "On Site":
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
            <PhotoUpload
              label="Foto Tiba di Lokasi"
              photoUrlOrPath={booking.photos?.arrival}
              onUploadFile={(f) => handlePhotoUpload("arrival", f)}
            />

            {booking.photos?.arrival && (
              <PhotoUpload
                label="Foto Sebelum Pengerjaan"
                photoUrlOrPath={booking.photos?.before}
                onUploadFile={(f) => handlePhotoUpload("before", f)}
              />
            )}

            <button
              onClick={() => handleStatusUpdate("In Progress")}
              disabled={!booking.photos?.arrival || !booking.photos?.before}
              className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
            >
              Mulai Pekerjaan
            </button>
          </div>
        );

      case "In Progress":
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
            {isEndDate ? (
              <button
                onClick={() => setIsCompleting(true)}
                className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                Selesaikan Pekerjaan
              </button>
            ) : (
              <p className="font-semibold text-yellow-600 dark:text-yellow-400 text-center">
                Pekerjaan Sedang Berlangsung
              </p>
            )}
          </div>
        );

      case "Completed":
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
            <p className="font-semibold text-green-600 dark:text-green-400">
              Pekerjaan Selesai
            </p>
          </div>
        );

      case "Cancelled":
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
            <p className="font-semibold text-red-600 dark:text-red-400">
              Dibatalkan
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border-l-4 border-transparent">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {booking.service}
            </p>
            <p className="font-bold text-lg text-gray-800 dark:text-white">
              {booking.name}
            </p>
          </div>
          {isJobActiveToday && (
            <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full">
              AKTIF HARI INI
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-secondary dark:text-slate-300">
          <p>
            <strong>Jadwal:</strong> {formatSchedule()}
          </p>
          <p>
            <strong>Alamat:</strong> {booking.address}
          </p>
          <p>
            <strong>Telepon:</strong> {booking.whatsapp}
          </p>
        </div>

        {isCompleting ? (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
            <h4 className="font-bold text-center">Formulir Penyelesaian</h4>

            <PhotoUpload
              label="Foto Setelah Selesai"
              photoUrlOrPath={booking.photos?.after}
              onUploadFile={(f) => handlePhotoUpload("after", f)}
            />

            <div>
              <label
                htmlFor={`notes-${booking.id}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Catatan Pekerjaan Tambahan
              </label>
              <textarea
                id={`notes-${booking.id}`}
                rows={3}
                value={additionalWorkNotes}
                onChange={(e) => setAdditionalWorkNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Catatan tambahan..."
              />
            </div>

            <div>
              <label
                htmlFor={`costs-${booking.id}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Biaya Tambahan (Bahan, dll.)
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  id={`costs-${booking.id}`}
                  value={displayCosts}
                  onChange={handleCostChange}
                  onBlur={handleCostBlur}
                  className="block w-full rounded-md border-gray-300 pl-8 pr-2 dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setIsCompleting(false)}
                className="w-full bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>

              <button
                onClick={() => setIsConfirmingComplete(true)}
                disabled={!booking.photos?.after}
                className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400"
              >
                Konfirmasi Selesai
              </button>
            </div>
          </div>
        ) : (
          renderAction()
        )}
      </div>

      <GenericConfirmationModal
        isOpen={isConfirmingComplete}
        onClose={() => setIsConfirmingComplete(false)}
        onConfirm={executeCompleteJob}
        title="Konfirmasi Penyelesaian"
        confirmText="Ya, Selesaikan"
        confirmButtonClass="bg-green-600 hover:bg-green-700 focus:ring-green-500"
      >
        <p>Apakah Anda yakin ingin menyelesaikan pekerjaan ini?</p>
      </GenericConfirmationModal>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               JOBS SECTION                                  */
/* -------------------------------------------------------------------------- */

type TechnicianJobsSectionProps = {
  jobFilter: "upcoming" | "completed";
  setJobFilter: React.Dispatch<React.SetStateAction<"upcoming" | "completed">>;
  refreshBookings: () => Promise<void>;
  categories: Record<string, Booking[]>;
  completedJobs: Booking[];
  currentTechnicianId: number;
  onBookingUpdateLocal: (updated: Booking) => void;
  onRefresh: () => Promise<void>;
};

const TechnicianJobsSection: React.FC<TechnicianJobsSectionProps> = ({
  jobFilter,
  setJobFilter,
  refreshBookings,
  categories,
  completedJobs,
  currentTechnicianId,
  onBookingUpdateLocal,
  onRefresh,
}) => {
  const entries = useMemo(
    () => Object.entries(categories) as Array<[string, Booking[]]>,
    [categories]
  );

  const isUpcomingEmpty = useMemo(
    () => entries.every(([, jobs]) => jobs.length === 0),
    [entries]
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-slate-800 p-1">
          <button
            onClick={() => setJobFilter("upcoming")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              jobFilter === "upcoming"
                ? "bg-primary text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            Akan Datang
          </button>
          <button
            onClick={() => setJobFilter("completed")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              jobFilter === "completed"
                ? "bg-primary text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            Riwayat
          </button>
        </div>

        <button
          onClick={refreshBookings}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {jobFilter === "upcoming" &&
        (isUpcomingEmpty ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Tidak Ada Tugas Akan Datang
            </h3>
          </div>
        ) : (
          <div className="space-y-10">
            {entries.map(([title, jobs]) =>
              jobs.length > 0 ? (
                <div key={title}>
                  <h3 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
                    {title}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        booking={job}
                        currentTechnicianId={currentTechnicianId}
                        onBookingUpdateLocal={onBookingUpdateLocal}
                        onRefresh={onRefresh}
                      />
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        ))}

      {jobFilter === "completed" &&
        (completedJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedJobs.map((job) => (
              <JobCard
                key={job.id}
                booking={job}
                currentTechnicianId={currentTechnicianId}
                onBookingUpdateLocal={onBookingUpdateLocal}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Belum Ada Riwayat Tugas
            </h3>
          </div>
        ))}
    </div>
  );
};

export default TechnicianJobsSection;
