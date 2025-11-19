// ../lib/api/admin.ts

import { Service, ServiceCategory } from '../config/services';
import { Booking, BookingStatus } from './storage';

// ====== API BASE URL ======
export const API_BASE_URL = 'http://localhost:4222/api/v1';

// ====== TYPES DARI API BACKEND ======

export interface User {
  id: number;
  name: string; // dari "fullname"
  username: string;
  role: string;
  created_at?: string;
  password?: string; // dipakai hanya di UI form
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
  technicianUserId?: number | null; // <- user_id teknisi dari backend
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
  name: string;
  price: string;
  unit_price?: Service['priceUnit'] | string; // string dari API -> dinormalisasi
  category?: string;
  icon?: keyof typeof import('../config/services')['serviceIcons'];
  duration?: number;
  duration_days?: number;
};

// ====== HELPER & MAPPING ======

// format Date -> "YYYY-MM-DD" untuk query ?schedule_date=
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// mapping status API -> BookingStatus
export const mapApiStatusToBookingStatus = (status: string): BookingStatus => {
  switch (status.toUpperCase()) {
    case 'INPROGRESS':
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'DONE':
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
    case 'CANCELED':
      return 'Cancelled';
    case 'ONSITE':
    case 'ON_SITE':
      return 'On Site';
    default:
      return 'Confirmed';
  }
};

// mapping BookingStatus -> kode status backend
// ⚠️ SESUAIKAN ANGKA DI SINI DENGAN TABEL STATUS DI BACKEND-MU
export const BOOKING_STATUS_TO_API_CODE: Record<BookingStatus, string> = {
  Confirmed: '1',
  'On Site': '2',
  'In Progress': '3',
  Completed: '4',
  Cancelled: '5', // contoh: misal "5" = Cancelled -> sesuaikan sendiri
};

// ====== FUNGSI-FUNGSI API ======

// Mapping response API -> User
export async function fetchUsersFromApi(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/admin/user-management-list`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch users: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json.data) ? json.data : [];

  return data.map((u: any) => ({
    id: u.id,
    name: u.fullname,
    username: u.username,
    role: u.role,
    created_at: u.created_at,
  }));
}

// Mapping response API -> UserRole
export async function fetchRolesFromApi(): Promise<UserRole[]> {
  const res = await fetch(`${API_BASE_URL}/admin/user-role-list`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch roles: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json.data) ? json.data : [];

  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
  }));
}

// Mapping response API -> Service Master Category
export async function fetchServiceCategoriesFromApi(): Promise<ServiceMasterCategory[]> {
  const res = await fetch(`${API_BASE_URL}/admin/service-category-list`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch service categories: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json.data) ? json.data : [];

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
  }));
}

// --- API: fetch daftar booking untuk section "Daftar Booking" ---
export async function fetchBookingsFromApi(): Promise<AdminBooking[]> {
  const res = await fetch(`${API_BASE_URL}/admin/user-booking-list`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch booking list: ${res.status}`);
  }

  const json = await res.json();
  const data: ApiBookingItem[] = Array.isArray(json.data) ? json.data : [];

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

// --- API: fetch daftar layanan untuk section "Manajemen Layanan" ---
export async function fetchServicesFromApi(): Promise<ServiceCategory[]> {
  const res = await fetch(`${API_BASE_URL}/admin/service-list`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch services: ${res.status}`);
  }

  const json = await res.json();
  const data: ApiServiceItem[] = Array.isArray(json.data) ? json.data : [];

  const categoriesMap = new Map<string, ServiceCategory>();

  data.forEach((item) => {
    const categoryName = item.category || 'Layanan Umum';
    let category = categoriesMap.get(categoryName);
    if (!category) {
      category = { category: categoryName, services: [] };
      categoriesMap.set(categoryName, category);
    }

    // Normalisasi unit harga ke union type
    const rawUnit = (item.unit_price || '').toString().toLowerCase();
    let unit: Service['priceUnit'] = 'unit';

    if (rawUnit === 'unit') unit = 'unit';
    else if (rawUnit === 'jam' || rawUnit === 'hour' || rawUnit === 'hours') unit = 'jam';
    else if (rawUnit === 'kg') unit = 'kg';
    else if (rawUnit === 'm2' || rawUnit === 'm²') unit = 'm²';

    const service: Service = {
      name: item.name,
      icon: (item.icon as any) || 'Wrench',
      price: Number(item.price) || 0,
      priceUnit: unit,
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

// --- API: update status booking ---
// METHOD: PUT
// BODY: { form_id: "1", status: "5", user_id: <id teknisi> }
export async function updateBookingStatusOnServer(
  formId: number,
  newStatus: BookingStatus,
  userId: number,
) {
  const statusCode = BOOKING_STATUS_TO_API_CODE[newStatus];
  if (!statusCode) {
    throw new Error(`Kode status belum di-mapping untuk status: ${newStatus}`);
  }

  const payload: any = {
    form_id: String(formId),
    status: statusCode,
    user_id: userId,
  };

  const res = await fetch(`${API_BASE_URL}/admin/update-booking-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Gagal update status: ${res.status}`);
  }
}

// --- API: Tech Schedule (jadwal teknisi) ---
export async function fetchTechScheduleFromApi(date: Date): Promise<ApiTechScheduleByUser[]> {
  const dateStr = formatDateForApi(date);

  const res = await fetch(
    `${API_BASE_URL}/admin/tech-schedule?schedule_date=${encodeURIComponent(dateStr)}`,
    { credentials: 'include' },
  );

  if (!res.ok) {
    throw new Error(`Gagal fetch tech schedule: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json.data) ? json.data : [];

  return data.map(
    (row: any): ApiTechScheduleByUser => ({
      user_id: row.user_id,
      fullname: row.fullname,
      schedules: Array.isArray(row.schedules) ? row.schedules : [],
    }),
  );
}

// --- API: Create Service (pakai master category ID) ---
export async function createServiceOnServer(
  serviceData: Service,
  categoryName: string,
  serviceCategories: ServiceMasterCategory[],
): Promise<void> {
  const anyService = serviceData as any;

  const durationMinutes =
    anyService.duration_minute ??
    (typeof serviceData.duration === 'number' ? serviceData.duration : 0);

  const durationHours =
    anyService.duration_hour ??
    (typeof serviceData.duration === 'number' ? Math.floor(serviceData.duration / 60) : 0);

  // 🔴 AMBIL ID DARI MASTER SERVICE CATEGORY BERDASARKAN NAMA
  const masterCategory = serviceCategories.find((c) => c.name === categoryName);

  const payload = {
    name: serviceData.name,
    price: String(serviceData.price ?? 0),
    unit_price: serviceData.priceUnit ?? 'unit',
    point: anyService.point ?? 0,
    icon: serviceData.icon,
    // ⬇️ kirim ID, bukan nama lagi
    service_category_id: masterCategory ? masterCategory.id : null,
    duration_minute: durationMinutes,
    duration_hour: durationHours,
    is_guarantee: anyService.is_guarantee ?? false,
  };

  const res = await fetch(`${API_BASE_URL}/admin/service-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Gagal menyimpan layanan: ${res.status}`);
  }
}
