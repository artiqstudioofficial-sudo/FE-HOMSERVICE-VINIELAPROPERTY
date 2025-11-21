// components/BookingFormModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Service } from "../config/services";
import {
  User,
  BookingStatus,
  formatDateToKey,
  generateTimeSlots,
} from "../lib/storage";
import Calendar from "./Calendar";

export interface StoreBookingPayload {
  fullname: string;
  whatsapp: string;
  address: string;
  service: number;
  user_id: number | null;
  status: string;
  lat: number;
  lng: number;
  schedule_date: string;
  schedule_time: string;
}

// Lokasi default: Monas
const DEFAULT_LOCATION = {
  lat: -6.175392,
  lng: 106.827153,
  mapSrc:
    "https://maps.google.com/maps?q=-6.175392,106.827153&z=16&output=embed",
};

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: StoreBookingPayload) => void;
  services: Service[];
  technicians: User[];
  availability: {
    fullyBookedDates: string[];
    bookedSlots?: string[];
  };
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  services,
  technicians,
  availability,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    address: "",
    service: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    time: "",
    technician: "",
    status: "Confirmed" as BookingStatus,
  });

  const [location, setLocation] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData | "location", string>>
  >({});
  const [mapSrc, setMapSrc] = useState(DEFAULT_LOCATION.mapSrc);

  const safeServices = services ?? [];
  const safeTechnicians = technicians ?? [];
  const safeAvailability = availability ?? {
    fullyBookedDates: [],
    bookedSlots: [],
  };

  const fullyBookedDates = useMemo(
    () => new Set(safeAvailability.fullyBookedDates || []),
    [safeAvailability.fullyBookedDates]
  );

  const bookedSlots = useMemo(
    () => new Set(safeAvailability.bookedSlots || []),
    [safeAvailability.bookedSlots]
  );

  const availableTimes = useMemo(
    () => generateTimeSlots(9, 17, 12, 13, 30),
    []
  );

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        whatsapp: "",
        address: "",
        service: "",
        startDate: null,
        endDate: null,
        time: "",
        technician: "",
        status: "Confirmed",
      });
      setErrors({});
      // reset lokasi ke Monas setiap modal dibuka
      setLocation({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
      setMapSrc(DEFAULT_LOCATION.mapSrc);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (date: Date) => {
    const newEndDate = new Date(date);
    newEndDate.setDate(newEndDate.getDate());
    setFormData((prev) => ({
      ...prev,
      startDate: date,
      endDate: newEndDate,
      time: "",
    }));
    setErrors((prev) => ({ ...prev, startDate: undefined, time: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<
      Record<keyof typeof formData | "location", string>
    > = {};
    if (!formData.name.trim()) newErrors.name = "Nama wajib diisi.";
    if (!formData.whatsapp.trim())
      newErrors.whatsapp = "Nomor WhatsApp wajib diisi.";
    if (!formData.address.trim()) newErrors.address = "Alamat wajib diisi.";
    if (!formData.service) newErrors.service = "Layanan wajib dipilih.";
    if (!formData.startDate) newErrors.startDate = "Tanggal wajib dipilih.";
    if (!formData.time) newErrors.time = "Waktu wajib dipilih.";

    // location selalu ada (Monas), jadi tidak divalidasi lagi
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!formData.startDate) return;

    const schedule_date = formData.startDate.toISOString().slice(0, 10);

    const serviceId = Number(formData.service);
    const userId =
      formData.technician && formData.technician !== ""
        ? Number(formData.technician)
        : null;

    const payload: StoreBookingPayload = {
      fullname: formData.name,
      whatsapp: formData.whatsapp,
      address: formData.address,
      service: serviceId,
      user_id: userId,
      status: formData.status,
      lat: location.lat,
      lng: location.lng,
      schedule_date,
      schedule_time: formData.time,
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold font-poppins text-gray-800 dark:text-white">
              Tambah Booking Manual
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                />
                {errors.whatsapp && (
                  <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alamat Lengkap
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
              ></textarea>
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Layanan
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                >
                  <option value="" disabled>
                    -- Pilih Layanan --
                  </option>
                  {safeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.service && (
                  <p className="text-red-500 text-xs mt-1">{errors.service}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teknisi
                </label>
                <select
                  name="technician"
                  value={formData.technician}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                >
                  <option value="">Belum Ditugaskan</option>
                  {safeTechnicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullname || (t as any).name || t.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status Awal
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-slate-700 dark:border-slate-600 focus:border-primary focus:ring-primary"
                >
                  {[
                    "Confirmed",
                    "On Site",
                    "In Progress",
                    "Completed",
                    "Cancelled",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Jadwal
                </label>
                <Calendar
                  selectedDate={formData.startDate}
                  onDateSelect={handleDateSelect}
                  fullyBookedDates={fullyBookedDates}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>
              {formData.startDate ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Waktu Mulai
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => {
                      const slotKey = `${formatDateToKey(
                        formData.startDate!
                      )}-${time}`;
                      const isBooked = bookedSlots.has(slotKey);
                      return (
                        <button
                          type="button"
                          key={time}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, time }))
                          }
                          disabled={isBooked}
                          className={`p-2 rounded-md text-sm font-semibold border-2 transition-colors ${
                            formData.time === time
                              ? "bg-primary text-white border-primary"
                              : "bg-transparent border-gray-300 dark:border-slate-600"
                          } ${
                            isBooked
                              ? "bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-gray-500 line-through cursor-not-allowed"
                              : "hover:border-primary"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  {errors.time && (
                    <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Waktu Mulai
                  </label>
                  <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-gray-500">
                      Pilih tanggal dahulu
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Map - default Monas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lokasi (sementara default: Monas, Jakarta)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Untuk saat ini, lokasi booking akan tersimpan di sekitar Monas
                (lat: {DEFAULT_LOCATION.lat}, lng: {DEFAULT_LOCATION.lng}).
              </p>
              <div className="mt-2 h-64 w-full rounded-lg overflow-hidden border dark:border-slate-600">
                <iframe
                  key={mapSrc}
                  title="Booking Location Default Monas"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={mapSrc}
                  allowFullScreen={false}
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="p-6 bg-light-bg dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 rounded-b-2xl flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-200 font-bold px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark"
            >
              Simpan Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
