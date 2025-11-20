// components/admin/schedule/TechnicianSchedule.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Service } from "../../../config/services";
import {
  AdminBooking,
  fetchServicesFromApi, // ⬅️ pakai API ini
} from "../../../lib/api/admin";
import { BookingStatus, formatDateToKey } from "../../../lib/storage";

type Technician = {
  id: number;
  name: string;
  username: string;
  role: string;
};

type Props = {
  bookings: AdminBooking[];
  selectedDate: Date;
  technicians: Technician[];
};

const timelineStatusColors: { [key in BookingStatus]: string } = {
  Confirmed: "bg-blue-500 border-blue-700",
  "On Site": "bg-cyan-500 border-cyan-700",
  "In Progress": "bg-yellow-500 border-yellow-700",
  Completed: "bg-green-500 border-green-700",
  Cancelled: "bg-gray-400 border-gray-600",
};

const TechnicianSchedule: React.FC<Props> = ({
  bookings,
  selectedDate,
  technicians,
}) => {
  const START_HOUR = 8;
  const END_HOUR = 18;
  const WORKDAY_MINUTES = (END_HOUR - START_HOUR - 1) * 60;
  const totalMinutes = (END_HOUR - START_HOUR) * 60;

  // Map nama service -> detail service (dari API)
  const [servicesMap, setServicesMap] = useState<Map<string, Service>>(
    () => new Map()
  );
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // ================== LOAD SERVICES DARI API SEKALI DI MOUNT ==================
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        setServicesError(null);

        const services = await fetchServicesFromApi();
        const map = new Map<string, Service>();

        services.forEach((service) => {
          // key pakai nama service, sama seperti booking.service
          map.set(service.name, service);
        });

        setServicesMap(map);
      } catch (err) {
        console.error("Gagal memuat services dari API:", err);
        setServicesError("Gagal memuat data layanan dari server.");
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  // ================== FILTER BOOKING BERDASARKAN TANGGAL ==================
  const filteredBookings = useMemo(() => {
    const selectedDateKey = formatDateToKey(selectedDate);
    return bookings.filter((b) => {
      const start = formatDateToKey(new Date(b.startDate));
      const end = formatDateToKey(new Date(b.endDate));
      return (
        selectedDateKey >= start &&
        selectedDateKey <= end &&
        b.status !== "Cancelled"
      );
    });
  }, [bookings, selectedDate]);

  const timelineHours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  const getProgressBarColor = (percentage: number) => {
    if (percentage > 80) return "bg-red-500";
    if (percentage > 50) return "bg-yellow-400";
    return "bg-green-500";
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6">
      <h2 className="text-xl font-bold font-poppins text-gray-800 dark:text-white mb-4">
        Jadwal Teknisi untuk{" "}
        {selectedDate.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </h2>

      {/* Info loading/error untuk layanan */}
      {loadingServices && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Memuat data layanan...
        </p>
      )}
      {servicesError && (
        <p className="text-sm text-red-500 dark:text-red-400 mb-2">
          {servicesError}
        </p>
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* header jam */}
          <div className="flex border-b-2 border-gray-200 dark:border-slate-700 pb-2">
            <div className="w-48 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-10">
              {timelineHours.map((hour) => (
                <div
                  key={hour}
                  className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {/* tiap teknisi */}
          {technicians.map((tech) => {
            const techBookings = filteredBookings.filter(
              (b) => b.technician === tech.name
            );

            const totalWorkMinutes = techBookings.reduce((total, booking) => {
              const service = servicesMap.get(booking.service);
              if (!service) return total;

              const isMultiDay =
                service.duration_days && service.duration_days > 1;
              const isStartDate =
                formatDateToKey(new Date(booking.startDate)) ===
                formatDateToKey(selectedDate);

              if (isMultiDay && !isStartDate) {
                return total + WORKDAY_MINUTES;
              }

              const duration = service.duration ?? 60; // default 60 menit kalau kosong
              return total + duration;
            }, 0);

            const workloadPercentage = Math.min(
              (totalWorkMinutes / WORKDAY_MINUTES) * 100,
              100
            );
            const progressBarColor = getProgressBarColor(workloadPercentage);

            return (
              <div
                key={tech.id}
                className="flex border-b border-gray-100 dark:border-slate-700/50"
              >
                {/* info teknisi + KPI harian */}
                <div className="w-48 flex-shrink-0 py-3 px-2 border-r border-gray-100 dark:border-slate-700/50">
                  <p className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">
                    {tech.name}
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      <span>Beban Kerja</span>
                      <span>
                        {(totalWorkMinutes / 60).toFixed(1)} /{" "}
                        {WORKDAY_MINUTES / 60} jam
                      </span>
                    </div>
                    <div
                      className="w-full bg-gray-200 rounded-full h-2 dark:bg-slate-700"
                      title={`${workloadPercentage.toFixed(0)}% terisi`}
                    >
                      <div
                        className={`${progressBarColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${workloadPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* timeline */}
                <div className="flex-1 h-20 relative">
                  {timelineHours.map((hour) => (
                    <div
                      key={`line-${hour}`}
                      className="absolute h-full border-l border-gray-100 dark:border-slate-700/50"
                      style={{
                        left: `${
                          ((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100
                        }%`,
                      }}
                    ></div>
                  ))}

                  {techBookings.map((booking) => {
                    const serviceInfo = servicesMap.get(booking.service);
                    const isMultiDay = booking.startDate !== booking.endDate;
                    const isStartDate =
                      formatDateToKey(new Date(booking.startDate)) ===
                      formatDateToKey(selectedDate);

                    let minutesFromStart: number;
                    let durationMinutes: number;

                    if (isMultiDay && !isStartDate) {
                      minutesFromStart = 0;
                      durationMinutes = (END_HOUR - START_HOUR) * 60;
                    } else {
                      const [hour, minute] = booking.time
                        .split(":")
                        .map(Number);
                      minutesFromStart =
                        (hour - START_HOUR) * 60 + (minute || 0);

                      durationMinutes = serviceInfo
                        ? serviceInfo.duration ?? 60
                        : 60;
                    }

                    const leftPercent = (minutesFromStart / totalMinutes) * 100;
                    const widthPercent = (durationMinutes / totalMinutes) * 100;

                    if (leftPercent < 0 || leftPercent >= 100) return null;

                    const statusColorClass =
                      timelineStatusColors[booking.status] ||
                      "bg-gray-500 border-gray-700";

                    return (
                      <div
                        key={booking.id}
                        className={`absolute top-2 h-16 ${statusColorClass} rounded-lg p-2 text-white shadow-md overflow-hidden border-l-4`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        title={`${booking.name} - ${booking.service} @ ${booking.time} [Status: ${booking.status}]`}
                      >
                        <p className="text-xs font-bold truncate">
                          {booking.name}
                        </p>
                        <p className="text-[10px] opacity-80 truncate">
                          {booking.service}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredBookings.length === 0 && !loadingServices && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Tidak ada jadwal pekerjaan untuk tanggal ini.
        </div>
      )}
    </div>
  );
};

export default TechnicianSchedule;
