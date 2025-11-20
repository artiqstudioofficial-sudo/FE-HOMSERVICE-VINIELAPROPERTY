// ../lib/api/admin.ts

import { Service, ServiceCategory } from '../../config/services';
import { Booking, BookingStatus } from '../storage';
import { apiArray, apiRequest, formatDateForApi } from './client';

export { formatDateForApi } from './client';

/* -------------------------------------------------------------------------- */
/*                               ADMIN ENDPOINTS                              */
/* -------------------------------------------------------------------------- */

const ADMIN_ENDPOINTS = {
  users: '/admin/user-management-list',
  roles: '/admin/user-role-list',
  serviceCategories: '/admin/service-category-list',
  bookings: '/admin/user-booking-list',
  services: '/admin/service-list',
  updateBookingStatus: '/admin/update-booking-status',
  techSchedule: '/admin/tech-schedule',
  serviceCreate: '/admin/service-store',
  serviceUpdate: '/admin/service-update',
} as const;

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface User {
  id: number;
  name: string; // dari "fullname"
  username: string;
  role: string;
  created_at?: string;
  password?: string; // hanya untuk UI form
}

export interface UserRole {
  id: number;
  name: string; // "admin", "technician", dll
}

// Master service category dari API /admin/service-category-list
export interface ServiceMasterCategory {
  id: number;
  name: string;
}

// Booking yang dipakai di Admin (boleh punya formId/applyId dari backend)
export type AdminBooking = Booking & {
  formId?: number;
  applyId?: number;
  technicianUserId?: number | null; // user_id teknisi dari backend
};

// ----- Types untuk Tech Schedule API -----
export type ApiTechScheduleItem = {
  apply_id: number;
  form_id: number;
  fullname: string; // nama customer
  wa: string;
  address: string;
  service: string;
  schedule_date: string; // "2025-11-16"
  schedule_time: string; // "12:30"
  status: string; // "INPROGRESS" | dll
};

export type ApiTechScheduleByUser = {
  user_id: number;
  fullname: string; // nama teknisi
  schedules: ApiTechScheduleItem[];
};

// ----- Types untuk Booking List API -----
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

// ----- Types untuk Service List API -----
export type ApiServiceItem = {
  id: number;
  name: string;
  price: string;
  unit_price?: Service['priceUnit'] | string; // string dari API -> dinormalisasi
  category?: string;
  icon?: keyof typeof import('../../config/services')['serviceIcons'];
  duration?: number;
  duration_days?: number;
};

/** Field ekstra yang kadang disisipkan di Service dari backend */
type ServiceBackendFields = Partial<{
  duration_minute: number;
  duration_hour: number;
  point: number;
  is_guarantee: boolean;
}>;

/* -------------------------------------------------------------------------- */
/*                              FORMAT & MAPPING                              */
/* -------------------------------------------------------------------------- */

/* ---------------------------- Status Booking ---------------------------- */

const API_STATUS_TO_BOOKING: Record<string, BookingStatus> = {
  INPROGRESS: 'In Progress',
  IN_PROGRESS: 'In Progress',
  DONE: 'Completed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  CANCELED: 'Cancelled',
  ONSITE: 'On Site',
  ON_SITE: 'On Site',
};

export const mapApiStatusToBookingStatus = (status: string): BookingStatus =>
  API_STATUS_TO_BOOKING[status.toUpperCase()] ?? 'Confirmed';

// ⚠️ SESUAIKAN ANGKA DI SINI DENGAN TABEL STATUS DI BACKEND-MU
export const BOOKING_STATUS_TO_API_CODE: Record<BookingStatus, string> = {
  Confirmed: '1',
  'On Site': '2',
  'In Progress': '3',
  Completed: '4',
  Cancelled: '5',
};

/* --------------------------- Normalisasi Unit --------------------------- */

const PRICE_UNIT_ALIASES: Record<string, Service['priceUnit']> = {
  unit: 'unit',
  jam: 'jam',
  hour: 'jam',
  hours: 'jam',
  kg: 'kg',
  m2: 'm²',
  'm²': 'm²',
};

function normalizePriceUnit(raw?: string | null): Service['priceUnit'] {
  const key = (raw ?? '').toString().toLowerCase();
  return PRICE_UNIT_ALIASES[key] ?? 'unit';
}

/* --------------------------- Duration Helpers --------------------------- */

function computeDuration(service: Service & ServiceBackendFields): {
  durationMinutes: number;
  durationHours: number;
} {
  const fromBackendMinute = service.duration_minute;
  const fromBackendHour = service.duration_hour;

  if (typeof fromBackendMinute === 'number' || typeof fromBackendHour === 'number') {
    return {
      durationMinutes: fromBackendMinute ?? (fromBackendHour ?? 0) * 60,
      durationHours: fromBackendHour ?? Math.floor((fromBackendMinute ?? 0) / 60),
    };
  }

  const duration = typeof service.duration === 'number' ? service.duration : 0;
  return {
    durationMinutes: duration,
    durationHours: Math.floor(duration / 60),
  };
}

/* -------------------------------------------------------------------------- */
/*                               API FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/* ---------------------------- User Management ---------------------------- */

export async function fetchUsersFromApi(): Promise<User[]> {
  const data = await apiArray<any>(ADMIN_ENDPOINTS.users);

  return data.map(
    (u): User => ({
      id: u.id,
      name: u.fullname,
      username: u.username,
      role: u.role,
      created_at: u.created_at,
    }),
  );
}

/* ------------------------------ User Roles ------------------------------ */

export async function fetchRolesFromApi(): Promise<UserRole[]> {
  const data = await apiArray<any>(ADMIN_ENDPOINTS.roles);

  return data.map(
    (r): UserRole => ({
      id: r.id,
      name: r.name,
    }),
  );
}

/* ---------------------- Master Service Category List -------------------- */

export async function fetchServiceCategoriesFromApi(): Promise<ServiceMasterCategory[]> {
  const data = await apiArray<any>(ADMIN_ENDPOINTS.serviceCategories);

  return data.map(
    (c): ServiceMasterCategory => ({
      id: c.id,
      name: c.name,
    }),
  );
}

/* -------------------------- Booking List (Admin) ------------------------ */

export async function fetchBookingsFromApi(): Promise<AdminBooking[]> {
  const data = await apiArray<ApiBookingItem>(ADMIN_ENDPOINTS.bookings);

  return data.map((row): AdminBooking => {
    const scheduleDate = row.schedule_date;
    const status = mapApiStatusToBookingStatus(row.status);

    return {
      id: row.apply_id, // pakai apply_id sebagai id unik di admin
      formId: row.form_id,
      applyId: row.apply_id,

      name: row.customer_name,
      whatsapp: row.customer_wa,
      service: row.service,
      address: row.address,
      startDate: scheduleDate,
      endDate: scheduleDate,
      time: row.schedule_time,

      technician: row.technician_name || 'Belum Ditugaskan',
      technicianUserId: row.technician_id ?? null,

      status,

      lat: Number(row.lat),
      lng: Number(row.lng),
      arrivalTime: null,
      startTime: null,
      endTime: null,
      workDurationMinutes: 0,
      additionalCosts: row.additional_cost ? Number(row.additional_cost) || 0 : 0,
      note: row.note || '',
      photos: {
        arrival: row.arrive_photo || undefined,
        before: row.before_photo || undefined,
        after: row.after_photo || undefined,
      },
    };
  });
}

/* --------------------------- Service List (Admin) ----------------------- */

export async function fetchServicesFromApi(): Promise<ServiceCategory[]> {
  const data = await apiArray<ApiServiceItem>(ADMIN_ENDPOINTS.services);

  const categoriesMap = new Map<string, ServiceCategory>();

  data.forEach((item) => {
    const categoryName = item.category || 'Layanan Umum';
    let category = categoriesMap.get(categoryName);

    if (!category) {
      category = { category: categoryName, services: [] };
      categoriesMap.set(categoryName, category);
    }

    const service: Service = {
      name: item.name,
      icon: (item.icon as any) || 'Wrench',
      price: Number(item.price) || 0,
      priceUnit: normalizePriceUnit(item.unit_price as string),
      duration: item.duration ?? 60,
      durationDays: item.duration_days ?? 1,
      description: '',
      includes: [],
      excludes: [],
    };

    category.services.push(service);
  });

  return Array.from(categoriesMap.values());
}

/* ---------------------------- Update Booking ---------------------------- */

// METHOD: PUT
// BODY: { form_id: "1", status: "5", user_id: <id teknisi> }
export async function updateBookingStatusOnServer(
  formId: number,
  newStatus: BookingStatus,
  userId: number,
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
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/* -------------------------- Tech Schedule (Admin) ----------------------- */

export async function fetchTechScheduleFromApi(date: Date): Promise<ApiTechScheduleByUser[]> {
  const dateStr = formatDateForApi(date);

  const data = await apiArray<any>(
    `${ADMIN_ENDPOINTS.techSchedule}?schedule_date=${encodeURIComponent(dateStr)}`,
  );

  return data.map(
    (row): ApiTechScheduleByUser => ({
      user_id: row.user_id,
      fullname: row.fullname,
      schedules: Array.isArray(row.schedules) ? row.schedules : [],
    }),
  );
}

/* ----------------------- Create & Update Service API -------------------- */

export async function createServiceOnServer(
  serviceData: Service,
  categoryName: string,
  serviceCategories: ServiceMasterCategory[],
): Promise<void> {
  const service = serviceData as Service & ServiceBackendFields;
  const { durationMinutes, durationHours } = computeDuration(service);

  // Ambil ID dari master category berdasarkan nama
  const masterCategory = serviceCategories.find((c) => c.name === categoryName);

  const payload = {
    name: service.name,
    price: String(service.price ?? 0),
    unit_price: service.priceUnit ?? 'unit',
    point: service.point ?? 0,
    icon: service.icon,
    service_category_id: masterCategory ? masterCategory.id : null,
    duration_minute: durationMinutes,
    duration_hour: durationHours,
    is_guarantee: service.is_guarantee ?? false,
  };

  await apiRequest(ADMIN_ENDPOINTS.serviceCreate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// URL: /admin/service-update
// BACKEND expect:
//   { id, name, price, unit_price, service_category, duration_minute, duration_hour, is_guarantee }
export async function updateServiceOnServer(
  id: number,
  serviceData: Service,
  categoryName: string,
): Promise<void> {
  const service = serviceData as Service & ServiceBackendFields;
  const { durationMinutes, durationHours } = computeDuration(service);

  const payload = {
    id,
    name: service.name,
    price: String(service.price ?? 0),
    unit_price: service.priceUnit ?? 'unit',
    service_category: categoryName, // backend minta NAMA kategori
    duration_minute: durationMinutes,
    duration_hour: durationHours,
    is_guarantee: service.is_guarantee ?? false,
    // point: service.point ?? 0,
    // icon: service.icon,
  };

  await apiRequest(ADMIN_ENDPOINTS.serviceUpdate, {
    method: 'POST', // ganti ke 'PUT' kalau backend pakai PUT
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
