import { useNotification } from '@/contexts/NotificationContext';
import { updateBookingStatusOnServer } from '@/lib/api/admin';
import { simulateNotification } from '@/lib/notifications';
import { Booking, BookingStatus, uploadBookingPhoto } from '@/lib/storage';
import { Navigation } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import GenericConfirmationModal from '../../components/GenericConfirmationModal';
import { formatScheduleYYYYMMDD } from '../../components/utils/schedule';
import PhotoUpload from './PhotoUpload';

type Props = {
  booking: Booking;
  currentTechnicianId: number;
  onBookingUpdateLocal: (updatedBooking: Booking) => void;
  onRefresh: () => Promise<void>;
};

const JobCard: React.FC<Props> = ({
  booking,
  currentTechnicianId,
  onBookingUpdateLocal,
  onRefresh,
}) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startDate = useMemo(() => {
    const d = new Date(booking.startDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [booking.startDate]);

  const endDate = useMemo(() => {
    const d = new Date(booking.endDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [booking.endDate]);

  const isMultiDay = startDate.getTime() !== endDate.getTime();
  const isJobActiveToday = today >= startDate && today <= endDate;
  const isStartDate = today.getTime() === startDate.getTime();
  const isEndDate = today.getTime() === endDate.getTime();

  const [isCompleting, setIsCompleting] = useState(false);
  const [additionalWorkNotes, setAdditionalWorkNotes] = useState(booking.note || '');
  const [additionalCosts, setAdditionalCosts] = useState(booking.additionalCosts || 0);
  const [displayCosts, setDisplayCosts] = useState(() =>
    (booking.additionalCosts || 0).toString() === '0'
      ? '0'
      : new Intl.NumberFormat('id-ID').format(booking.additionalCosts || 0),
  );
  const [isConfirmingComplete, setIsConfirmingComplete] = useState(false);

  const { addNotification } = useNotification();

  const getFormId = () => {
    const formId = (booking as any).formId ?? (booking as any).form_id ?? null;
    if (!formId) throw new Error('form_id tidak ditemukan pada booking (cek mapping API).');
    return Number(formId);
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setAdditionalCosts(0);
      setDisplayCosts('');
      return;
    }
    const numericValue = parseInt(value.replace(/\./g, ''), 10);
    if (!isNaN(numericValue)) {
      setAdditionalCosts(numericValue);
      setDisplayCosts(new Intl.NumberFormat('id-ID').format(numericValue));
    }
  };

  const handleCostBlur = () => {
    if (displayCosts === '') setDisplayCosts('0');
  };

  const pushStatusToServer = async (nextStatus: BookingStatus, patch?: Partial<Booking>) => {
    const formId = getFormId();

    await updateBookingStatusOnServer(formId, nextStatus, currentTechnicianId);

    const updated: Booking = { ...booking, ...patch, status: nextStatus };
    onBookingUpdateLocal(updated);

    await onRefresh();
  };

  const handleStatusUpdate = async (status: BookingStatus) => {
    const nowIso = new Date().toISOString();

    try {
      if (status === 'On Site') {
        const uiMessage = simulateNotification('technician_on_the_way', {
          ...booking,
          status,
          arrivalTime: nowIso,
        });
        addNotification(uiMessage, 'info');
        await pushStatusToServer(status, { arrival_time: nowIso });
        return;
      }

      if (status === 'In Progress') {
        await pushStatusToServer(status, { start_time: nowIso });
        return;
      }

      await pushStatusToServer(status);
    } catch (err: any) {
      console.error(err);
      addNotification(err?.message || 'Gagal update status di server.', 'error');
    }
  };

  const handlePhotoUpload = async (type: 'arrival' | 'before' | 'after', file: File) => {
    const formId = getFormId();
    const result = await uploadBookingPhoto(Number(formId), type, file);
    const url = result?.url;

    const updated: Booking = {
      ...booking,
      photos: { ...(booking.photos || {}), [type]: url },
    };
    onBookingUpdateLocal(updated);

    await onRefresh();
  };

  const handleCompleteJob = () => {
    if (!booking.photos?.after) {
      alert('Harap unggah foto setelah pengerjaan selesai.');
      return;
    }
    setIsConfirmingComplete(true);
  };

  const executeCompleteJob = async () => {
    try {
      const now = new Date();
      const startIso = booking.startTime || new Date().toISOString();
      const startTime = new Date(startIso);
      const duration = Math.round((now.getTime() - startTime.getTime()) / 60000);

      await pushStatusToServer('Completed', {
        end_time: now.toISOString(),
        work_duration_minutes: String(duration),
        note: additionalWorkNotes,
        additional_cost: additionalCosts,
      });

      const uiMessage = simulateNotification('job_completed', {
        ...booking,
        status: 'Completed',
      } as any);
      addNotification(uiMessage, 'success');

      setIsCompleting(false);
      setIsConfirmingComplete(false);
    } catch (err: any) {
      console.error(err);
      addNotification(err?.message || 'Gagal menyelesaikan pekerjaan.', 'error');
    }
  };

  const renderAction = () => {
    if (!isJobActiveToday && booking.status !== 'Completed' && booking.status !== 'Cancelled') {
      return (
        <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
          <p className="font-semibold text-gray-500 dark:text-gray-400">Tugas belum dimulai.</p>
        </div>
      );
    }

    switch (booking.status) {
      case 'Confirmed':
        if (!isStartDate)
          return (
            <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
              <p className="font-semibold text-gray-500 dark:text-gray-400">
                Tugas dimulai pada {booking.startDate?.slice(0, 10)}
              </p>
            </div>
          );
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700">
            <button
              onClick={() => handleStatusUpdate('On Site')}
              className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Saya Sudah di Lokasi
            </button>
          </div>
        );

      case 'On Site':
        if (!isStartDate)
          return (
            <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
              <p className="font-semibold text-gray-500 dark:text-gray-400">
                Menunggu hari pertama dimulai.
              </p>
            </div>
          );
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
            {booking.arrivalTime && (
              <p className="text-sm text-center font-semibold text-blue-600 dark:text-blue-400">
                Tiba pada: {new Date(booking.arrivalTime).toLocaleTimeString('id-ID')}
              </p>
            )}

            <PhotoUpload
              label="Foto Tiba di Lokasi"
              photoUrlOrPath={booking.photos?.arrival}
              onUploadFile={(f) => handlePhotoUpload('arrival', f)}
            />

            {booking.photos?.arrival && (
              <PhotoUpload
                label="Foto Sebelum Pengerjaan"
                photoUrlOrPath={booking.photos?.before}
                onUploadFile={(f) => handlePhotoUpload('before', f)}
              />
            )}

            <button
              onClick={() => handleStatusUpdate('In Progress')}
              disabled={!booking.photos?.arrival || !booking.photos?.before}
              className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
            >
              Mulai Pekerjaan
            </button>
          </div>
        );

      case 'In Progress':
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-4">
            {booking.startTime && (
              <p className="text-sm text-center font-semibold text-yellow-600 dark:text-yellow-400">
                Mulai pada: {new Date(booking.startTime).toLocaleTimeString('id-ID')}
              </p>
            )}
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

      case 'Completed':
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
            <p className="font-semibold text-green-600 dark:text-green-400">Pekerjaan Selesai</p>
          </div>
        );

      case 'Cancelled':
        return (
          <div className="mt-4 pt-4 border-t dark:border-slate-700 text-center">
            <p className="font-semibold text-red-600 dark:text-red-400">Dibatalkan</p>
          </div>
        );

      default:
        return null;
    }
  };

  const scheduleText = formatScheduleYYYYMMDD(booking.startDate, booking.endDate, booking.time);

  return (
    <div
      className={`bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border-l-4 ${
        isJobActiveToday ? 'border-primary' : 'border-transparent'
      }`}
      data-aos="fade-up"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{booking.service}</p>
            <p className="font-bold text-lg text-gray-800 dark:text-white">{booking.name}</p>
          </div>
          {isJobActiveToday && (
            <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full">
              AKTIF HARI INI
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm text-secondary dark:text-slate-300">
          <p>
            <strong>Jadwal:</strong> {scheduleText}
          </p>

          <div>
            <p>
              <strong>Alamat:</strong> {booking.address}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${booking.lat},${booking.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <Navigation size={14} />
              Dapatkan Arah
            </a>
          </div>

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
              onUploadFile={(f) => handlePhotoUpload('after', f)}
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
                onClick={handleCompleteJob}
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
        <p>
          Apakah Anda yakin ingin menyelesaikan pekerjaan ini? Pastikan data dan foto sudah benar.
        </p>
      </GenericConfirmationModal>
    </div>
  );
};

export default JobCard;
