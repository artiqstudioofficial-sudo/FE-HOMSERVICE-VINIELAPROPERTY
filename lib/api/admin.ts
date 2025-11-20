// ../lib/api/admin.ts

import { Service } from "../../config/services";
import { Booking, BookingStatus } from "../storage";
import { apiArray, apiRequest, formatDateForApi } from "./client";

export { formatDateForApi } from "./client";

/* -------------------------------------------------------------------------- */
/*                               ADMIN ENDPOINTS                              */
/* -------------------------------------------------------------------------- */

export const ADMIN_ENDPOINTS = {
  users: "/admin/user-management-list",
  roles: "/admin/user-role-list",
  serviceCategories: "/admin/service-category-list",
  bookings: "/admin/user-booking-list",
  services: "/admin/service-list",
  updateBookingStatus: "/admin/update-booking-status",
  techSchedule: "/admin/tech-schedule",
  serviceCreate: "/admin/service-store",
  serviceUpdate: "/admin/service-update",
  serviceDelete: "/admin/service-delete",
} as const;

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  created_at?: string;
  password?: string;
}

export interface UserRole {
  id: number;
  name: string;
}

export interface ServiceMasterCategory {
  id: number;
  name: string;
}

export type AdminBooking = Booking & {
  formId?: number;
  applyId?: number;
  technicianUserId?: number | null;
};

export type ApiTechScheduleItem = {
  apply_id: number;
  form_id: number;
  fullname: string;
  wa: string;
  address: string;
  service: string;
  schedule_date: string;
  schedule_time: string;
  status: string;
};

export type ApiTechScheduleByUser = {
  user_id: number;
  fullname: string;
  schedules: ApiTechScheduleItem[];
};

export type ApiBookingItem = {
  apply_id: number;
  form_id: number;
  technician_id: number | null;
  technician_name: string | null;
  technician_username: string | null;
  role: string;
  user_created_at: string;
  customer_name: string;
  customer_wa: string;
  address: string;
  service: string;
  schedule_date: string;
  schedule_time: string;
  status: string;
  lat: string;
  lng: string;
  note: string | null;
  additional_cost: string | null;
  arrive_photo: string | null;
  before_photo: string | null;
  after_photo: string | null;
};

export type ApiServiceItem = {
  id: number;
  name: string;
  price: string;
  unit_price: string;
  category: string;
  service_category: number;

  duration_minute?: number;
  duration_hour?: number;
  point?: number;
  is_guarantee?: boolean;
};

type ServiceBackendFields = Partial<{
  duration_minute: number;
  duration_hour: number;
  point: number;
  is_guarantee: boolean;
}>;

/* -------------------------------------------------------------------------- */
/*                              FORMAT & MAPPING                              */
/* -------------------------------------------------------------------------- */

const API_STATUS_TO_BOOKING: Record<string, BookingStatus> = {
  INPROGRESS: "In Progress",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
  ONSITE: "On Site",
  ON_SITE: "On Site",
};

export const mapApiStatusToBookingStatus = (status: string): BookingStatus =>
  API_STATUS_TO_BOOKING[status.toUpperCase()] ?? "Confirmed";

export const BOOKING_STATUS_TO_API_CODE: Record<BookingStatus, string> = {
  Confirmed: "1",
  "On Site": "2",
  "In Progress": "3",
  Completed: "4",
  Cancelled: "5",
};

const PRICE_UNIT_ALIASES: Record<string, Service["unit_price"]> = {
  unit: "unit",
  jam: "jam",
  hour: "jam",
  hours: "jam",
  kg: "kg",
  m2: "m²",
  "m²": "m²",
};

function normalizePriceUnit(raw?: string | null): Service["unit_price"] {
  const key = (raw ?? "").toString().toLowerCase();
  return PRICE_UNIT_ALIASES[key] ?? "unit";
}

function computeDuration(service: Service & ServiceBackendFields): {
  durationMinutes: number;
  durationHours: number;
} {
  const fromBackendMinute = service.duration_minute;
  const fromBackendHour = service.duration_hour;

  if (
    typeof fromBackendMinute === "number" ||
    typeof fromBackendHour === "number"
  ) {
    const minutes = fromBackendMinute ?? (fromBackendHour ?? 0) * 60;
    const hours = fromBackendHour ?? Math.floor(minutes / 60);
    return {
      durationMinutes: minutes,
      durationHours: hours,
    };
  }

  return {
    durationMinutes: 0,
    durationHours: 0,
  };
}

/* -------------------------------------------------------------------------- */
/*                               API FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

export async function fetchUsersFromApi(): Promise<User[]> {
  const data = await apiArray<any>(ADMIN_ENDPOINTS.users);

  return data.map(
    (u): User => ({
      id: u.id,
      name: u.fullname,
      username: u.username,
      role: u.role,
      created_at: u.created_at,
    })
  );
}

export async function fetchRolesFromApi(): Promise<UserRole[]> {
  const data = await apiArray<any>(ADMIN_ENDPOINTS.roles);

  return data.map(
    (r): UserRole => ({
      id: r.id,
      name: r.name,
    })
  );
}

export async function fetchServiceCategoriesFromApi(): Promise<
  ServiceMasterCategory[]
> {
  const data = await apiArray<any>(ADMIN_ENDPOINTS.serviceCategories);

  return data.map(
    (c): ServiceMasterCategory => ({
      id: c.id,
      name: c.name,
    })
  );
}

export async function fetchBookingsFromApi(): Promise<AdminBooking[]> {
  const data = await apiArray<ApiBookingItem>(ADMIN_ENDPOINTS.bookings);

  return data.map((row): AdminBooking => {
    const scheduleDate = row.schedule_date;
    const status = mapApiStatusToBookingStatus(row.status);

    return {
      id: row.apply_id,
      formId: row.form_id,
      applyId: row.apply_id,

      name: row.customer_name,
      whatsapp: row.customer_wa,
      service: row.service,
      address: row.address,
      startDate: scheduleDate,
      endDate: scheduleDate,
      time: row.schedule_time,

      technician: row.technician_name || "Belum Ditugaskan",
      technicianUserId: row.technician_id ?? null,

      status,

      lat: Number(row.lat),
      lng: Number(row.lng),
      arrivalTime: null,
      startTime: null,
      endTime: null,
      workDurationMinutes: 0,
      additionalCosts: row.additional_cost
        ? Number(row.additional_cost) || 0
        : 0,
      note: row.note || "",
      photos: {
        arrival: row.arrive_photo || undefined,
        before: row.before_photo || undefined,
        after: row.after_photo || undefined,
      },
    };
  });
}

export async function fetchServicesFromApi(): Promise<Service[]> {
  const data = await apiArray<ApiServiceItem>(ADMIN_ENDPOINTS.services);

  return data.map((item): Service & ServiceBackendFields => {
    const unit = normalizePriceUnit(item.unit_price);

    return {
      id: item.id,
      name: item.name,
      price: item.price,
      unit_price: unit,
      service_category: item.service_category,
      category: item.category,
      duration_minute: item.duration_minute,
      duration_hour: item.duration_hour,
      point: item.point,
      is_guarantee: item.is_guarantee,
    } as Service & ServiceBackendFields;
  });
}

// ------------------------ Update Booking Status ------------------------ //

export async function updateBookingStatusOnServer(
  formId: number,
  newStatus: BookingStatus,
  userId: number
): Promise<void> {
  const statusCode = BOOKING_STATUS_TO_API_CODE[newStatus];
  if (!statusCode) {
    throw new Error(`Kode status belum di-mapping untuk status: ${newStatus}`);
  }

  const payload = {
    form_id: String(formId),
    status: statusCode,
    user_id: userId,
  };

  await apiRequest(ADMIN_ENDPOINTS.updateBookingStatus, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// --------------------------- Tech Schedule ---------------------------- //

export async function fetchTechScheduleFromApi(
  date: Date
): Promise<ApiTechScheduleByUser[]> {
  const dateStr = formatDateForApi(date);

  const data = await apiArray<any>(
    `${ADMIN_ENDPOINTS.techSchedule}?schedule_date=${encodeURIComponent(
      dateStr
    )}`
  );

  return data.map(
    (row): ApiTechScheduleByUser => ({
      user_id: row.user_id,
      fullname: row.fullname,
      schedules: Array.isArray(row.schedules)
        ? (row.schedules as ApiTechScheduleItem[])
        : Array.isArray(row.schedules_json)
        ? (row.schedules_json as ApiTechScheduleItem[])
        : [],
    })
  );
}

// --------------------- Create & Update Service API --------------------- //

export async function createServiceOnServer(
  serviceData: Service,
  categoryName: string, // label (untuk fallback)
  serviceCategories: ServiceMasterCategory[]
): Promise<void> {
  const service = serviceData as Service & ServiceBackendFields;
  const { durationMinutes, durationHours } = computeDuration(service);

  // ⬇️ Prioritas pakai ID dari service.service_category
  const masterCategory =
    serviceCategories.find((c) => c.id === service.service_category) ||
    serviceCategories.find((c) => c.name === categoryName);

  const payload = {
    name: service.name,
    price: String(service.price ?? 0),
    unit_price: normalizePriceUnit(service.unit_price),
    point: service.point ?? 0,
    service_category_id: masterCategory ? masterCategory.id : null,
    duration_minute: durationMinutes,
    duration_hour: durationHours,
    is_guarantee: service.is_guarantee ?? false,
  };

  await apiRequest(ADMIN_ENDPOINTS.serviceCreate, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// BACKEND expect: { id, name, price, unit_price, service_category (INT), duration_minute, duration_hour, is_guarantee }
export async function updateServiceOnServer(
  id: number,
  serviceData: Service
): Promise<void> {
  const service = serviceData as Service & ServiceBackendFields;
  const { durationMinutes, durationHours } = computeDuration(service);

  const payload = {
    id,
    name: service.name,
    price: String(service.price ?? 0),
    unit_price: normalizePriceUnit(service.unit_price),
    // ⬇️ SEKARANG INTEGER ID, BUKAN NAMA
    service_category: service.service_category,
    duration_minute: durationMinutes,
    duration_hour: durationHours,
    is_guarantee: service.is_guarantee ?? false,
  };

  await apiRequest(ADMIN_ENDPOINTS.serviceUpdate, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ---------------------------- Delete Service --------------------------- //

export async function deleteServiceOnServer(id: number): Promise<void> {
  const payload = { id: String(id) };

  await apiRequest(ADMIN_ENDPOINTS.serviceDelete, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
