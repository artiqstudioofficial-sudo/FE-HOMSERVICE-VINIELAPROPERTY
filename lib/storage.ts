import {
  initialBookedSlots,
  initialFullyBookedDates,
} from "../config/availability";

/**
 * STORAGE FINAL (API)
 */

const API_BASE_URL = "https://api-homeservice.viniela.id";
const ADMIN_API = `${API_BASE_URL}/api/v1/admin`;

export type BookingStatus =
  | "Confirmed"
  | "On Site"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface Booking {
  id: number; // apply_id (kalau ada) atau form_id (untuk key UI)
  formId: number; // ✅ form_id asli (buat update status / upload photo)
  applyId?: number | null;

  name: string;
  whatsapp: string;
  address: string;
  service: string;

  startDate: string; // ISO
  endDate: string; // ISO
  time: string;

  status: BookingStatus;

  technician: string;
  technicianId?: number | null;
  technicianUsername?: string | null;

  lat: number;
  lng: number;

  arrivalTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  workDurationMinutes?: number | null;

  photos?: {
    arrival?: string;
    before?: string;
    after?: string;
  };

  note?: string;
  additionalCosts?: number;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: "admin" | "technician" | string;
}

interface Availability {
  fullyBookedDates: string[];
  bookedSlots?: string[];
}

/* -------------------------------------------------------------------------- */
/*                                   FETCH                                    */
/* -------------------------------------------------------------------------- */

async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Request gagal (status ${res.status})`;
    throw new Error(msg);
  }

  return (json?.data ?? json) as T;
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

export const formatDateToKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseKeyToDate = (key: string): Date => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const generateTimeSlots = (
  startHour: number,
  endHour: number,
  breakStartHour: number,
  breakEndHour: number,
  intervalMinutes: number
): string[] => {
  const slots: string[] = [];
  const date = new Date();
  date.setHours(startHour, 0, 0, 0);

  const endDate = new Date();
  endDate.setHours(endHour, 0, 0, 0);

  const breakStartDate = new Date();
  breakStartDate.setHours(breakStartHour, 0, 0, 0);

  const breakEndDate = new Date();
  breakEndDate.setHours(breakEndHour, 0, 0, 0);

  while (date < endDate) {
    if (date < breakStartDate || date >= breakEndDate) {
      slots.push(
        date
          .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          .replace(".", ":")
      );
    }
    date.setMinutes(date.getMinutes() + intervalMinutes);
  }
  return slots;
};

/* -------------------------------------------------------------------------- */
/*                                   BOOKINGS                                 */
/* -------------------------------------------------------------------------- */

type ApiBookingRow = {
  apply_id: number | null;
  form_id: number;

  technician_id: number | string | null;
  technician_name: string | null;
  technician_username: string | null;

  customer_name: string;
  customer_wa: string;
  address: string;
  service: string;

  schedule_date: string; // ISO "2025-12-15T00:00:00.000Z"
  schedule_time: string; // "16:30"
  status: string; // "ONSITE" etc.

  note?: string | null;
  additional_cost?: number | string | null;

  arrive_photo?: string | null;
  before_photo?: string | null;
  after_photo?: string | null;

  lat?: number | string | null;
  lng?: number | string | null;
};

function mapApiStatusToBookingStatus(apiStatus: string): BookingStatus {
  const s = (apiStatus || "").toLowerCase().trim();

  // support kode: ONSITE / INPROGRESS / CONFIRMED / COMPLETED / CANCELLED
  if (s === "confirmed" || s.includes("confirm")) return "Confirmed";

  if (
    s === "onsite" ||
    s === "on site" ||
    s.includes("on site") ||
    s.includes("onsite") ||
    s.includes("arrive")
  )
    return "On Site";

  if (s === "inprogress" || s === "in progress" || s.includes("progress"))
    return "In Progress";

  if (
    s === "completed" ||
    s.includes("complete") ||
    s.includes("done") ||
    s.includes("selesai")
  )
    return "Completed";

  if (
    s === "cancelled" ||
    s === "canceled" ||
    s.includes("cancel") ||
    s.includes("batal")
  )
    return "Cancelled";

  return "Confirmed";
}

function toNumberSafe(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const getBookings = async (): Promise<Booking[]> => {
  const rows = await apiFetch<ApiBookingRow[]>(
    `${ADMIN_API}/user-booking-list`
  );

  const mapped: Booking[] = (rows || []).map((r) => {
    // schedule_date sudah ISO string => simpan apa adanya (normalize ke ISO)
    const isoDate = new Date(r.schedule_date).toISOString();

    const lat = r.lat == null ? 0 : toNumberSafe(r.lat, 0);
    const lng = r.lng == null ? 0 : toNumberSafe(r.lng, 0);

    const technicianId =
      r.technician_id == null ? null : toNumberSafe(r.technician_id, 0);

    const applyId = r.apply_id ?? null;

    return {
      id: Number(applyId ?? r.form_id), // key UI
      formId: Number(r.form_id), // ✅ form id asli (buat update/upload)
      applyId,

      name: r.customer_name,
      whatsapp: r.customer_wa,
      address: r.address,
      service: r.service,

      startDate: isoDate,
      endDate: isoDate,
      time: r.schedule_time,

      status: mapApiStatusToBookingStatus(r.status),

      technician: r.technician_name || "Belum Ditugaskan",
      technicianId,
      technicianUsername: r.technician_username ?? null,

      lat,
      lng,

      note: r.note || "",
      additionalCosts:
        r.additional_cost == null ? 0 : toNumberSafe(r.additional_cost, 0),

      photos: {
        arrival: r.arrive_photo || undefined,
        before: r.before_photo || undefined,
        after: r.after_photo || undefined,
      },

      arrivalTime: null,
      startTime: null,
      endTime: null,
      workDurationMinutes: null,
    };
  });

  // terbaru dulu
  mapped.sort(
    (a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime() ||
      (b.applyId ?? b.formId) - (a.applyId ?? a.formId)
  );

  return mapped;
};

/* -------------------------------------------------------------------------- */
/*                                AVAILABILITY                                */
/* -------------------------------------------------------------------------- */

type ApiAvailability = {
  fullyBookedDates: string[];
  bookedSlots: string[];
  updatedAt?: string | null;
};

export const getAvailability = async (): Promise<Availability> => {
  try {
    const data = await apiFetch<ApiAvailability>(`${ADMIN_API}/availability`);
    return {
      fullyBookedDates: Array.isArray(data.fullyBookedDates)
        ? data.fullyBookedDates
        : [],
      bookedSlots: Array.isArray(data.bookedSlots) ? data.bookedSlots : [],
    };
  } catch (e) {
    console.warn("Availability API fallback ke config default:", e);
    return {
      fullyBookedDates: Array.from(initialFullyBookedDates),
      bookedSlots: Array.from(initialBookedSlots),
    };
  }
};

export const saveAvailability = async (
  availability: Partial<Availability>
): Promise<void> => {
  await apiFetch(`${ADMIN_API}/availability`, {
    method: "PUT",
    body: JSON.stringify({
      fullyBookedDates: availability.fullyBookedDates ?? [],
      bookedSlots: availability.bookedSlots ?? [],
    }),
  });
};

/* -------------------------------------------------------------------------- */
/*                                   USERS                                    */
/* -------------------------------------------------------------------------- */

type ApiUserRow = {
  id: number;
  fullname: string;
  username: string;
  role: string;
  created_at?: string;
};

export const getUsers = async (): Promise<User[]> => {
  const rows = await apiFetch<ApiUserRow[]>(
    `${ADMIN_API}/user-management-list`
  );
  return (rows || []).map((u) => ({
    id: u.id,
    name: u.fullname,
    username: u.username,
    role: (u.role || "").toLowerCase(),
  }));
};

/* -------------------------------------------------------------------------- */
/*                                   PHOTOS                                   */
/* -------------------------------------------------------------------------- */

export type PhotoType = "arrival" | "before" | "after";

export async function uploadBookingPhoto(
  formId: number,
  type: PhotoType,
  file: File
): Promise<{ form_id: number; type: PhotoType; url: string }> {
  const fd = new FormData();
  fd.append("form_id", String(formId));
  fd.append("type", type);
  fd.append("file", file);

  const res = await fetch(`${ADMIN_API}/booking-photo-upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Upload gagal (status ${res.status})`;
    throw new Error(msg);
  }

  const data = json?.data ?? json;
  return data;
}

export async function getBookingPhotos(formId: number): Promise<{
  arrival: string | null;
  before: string | null;
  after: string | null;
}> {
  const res = await fetch(`${ADMIN_API}/booking-photo?form_id=${formId}`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      `Fetch photo gagal (status ${res.status})`;
    throw new Error(msg);
  }

  const data = json?.data ?? json;
  return data?.photos || { arrival: null, before: null, after: null };
}

/**
 * helper untuk bikin URL absolute kalau backend hanya simpan path "/uploads/..."
 */
export function resolveAssetUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl}`;
}
