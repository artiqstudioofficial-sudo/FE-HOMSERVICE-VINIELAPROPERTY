import {
  initialBookedSlots,
  initialFullyBookedDates,
} from "../config/availability";

/**
 * STORAGE FINAL (API)
 * - bookings      : API
 * - users         : API
 * - availability  : API
 * - photos        : API upload + url saved to DB (forms.*_photo)
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
  id: number; // apply_id (kalau ada) atau form_id
  name: string; // customer_name
  whatsapp: string; // customer_wa
  address: string;
  service: string; // service name (dari query kamu)
  startDate: string; // ISO (dari schedule_date)
  endDate: string; // ISO (sama)
  time: string; // schedule_time
  status: BookingStatus;
  technician: string; // technician_name atau "Belum Ditugaskan"
  lat: number;
  lng: number;
  arrivalTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  workDurationMinutes?: number | null;
  photos?: {
    arrival?: string; // url/path dari backend
    before?: string;
    after?: string;
  };
  note?: string;
  additionalCosts?: number;
}

export interface User {
  id: number;
  name: string; // fullname
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

  // backend misc.response -> { error, message, data }
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

  technician_name: string | null;

  customer_name: string;
  customer_wa: string;
  address: string;
  service: string;

  schedule_date: string; // YYYY-MM-DD
  schedule_time: string; // HH:mm
  status: string; // form_statuses.name

  note?: string | null;
  additional_cost?: number | string | null;

  arrive_photo?: string | null;
  before_photo?: string | null;
  after_photo?: string | null;

  lat?: number | string | null;
  lng?: number | string | null;
};

function mapApiStatusToBookingStatus(apiStatus: string): BookingStatus {
  const s = (apiStatus || "").toLowerCase();
  if (s.includes("confirm")) return "Confirmed";
  if (s.includes("on site") || s.includes("onsite") || s.includes("arrive"))
    return "On Site";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("complete") || s.includes("done") || s.includes("selesai"))
    return "Completed";
  if (s.includes("cancel") || s.includes("batal")) return "Cancelled";
  return "Confirmed";
}

export const getBookings = async (): Promise<Booking[]> => {
  const rows = await apiFetch<ApiBookingRow[]>(
    `${ADMIN_API}/user-booking-list`
  );

  const mapped = (rows || []).map((r) => {
    const isoDate = new Date(r.schedule_date).toISOString();

    const latNum = r.lat == null ? 0 : Number(r.lat);
    const lngNum = r.lng == null ? 0 : Number(r.lng);

    return {
      id: Number(r.apply_id ?? r.form_id),
      name: r.customer_name,
      whatsapp: r.customer_wa,
      address: r.address,
      service: r.service,
      startDate: isoDate,
      endDate: isoDate,
      time: r.schedule_time,
      status: mapApiStatusToBookingStatus(r.status),
      technician: r.technician_name || "Belum Ditugaskan",
      lat: Number.isFinite(latNum) ? latNum : 0,
      lng: Number.isFinite(lngNum) ? lngNum : 0,
      note: r.note || "",
      additionalCosts:
        r.additional_cost == null ? 0 : Number(r.additional_cost) || 0,
      photos: {
        arrival: r.arrive_photo || undefined,
        before: r.before_photo || undefined,
        after: r.after_photo || undefined,
      },
      arrivalTime: null,
      startTime: null,
      endTime: null,
      workDurationMinutes: null,
    } as Booking;
  });

  // terbaru dulu
  mapped.sort(
    (a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime() ||
      b.id - a.id
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
 * - contoh: resolveAssetUrl("/uploads/forms/1/arrival.jpg")
 */
export function resolveAssetUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl}`;
}
