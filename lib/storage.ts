// lib/storage.ts

import { initialBookedSlots, initialFullyBookedDates } from '../config/availability';
import { ServiceCategory, allServicesData as initialServicesData } from '../config/services';

const BOOKINGS_STORAGE_KEY = 'vinielaBookings';
const AVAILABILITY_STORAGE_KEY = 'vinielaAvailability';
const PHOTO_STORAGE_PREFIX = 'vinielaPhoto-';
const SERVICES_STORAGE_KEY = 'vinielaServices';
const USERS_STORAGE_KEY = 'vinielaUsers';

// --- Types ---
export type BookingStatus = 'Confirmed' | 'On Site' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Booking {
  id: number;
  name: string;
  whatsapp: string;
  address: string;
  service: string;
  startDate: string;
  endDate: string;
  time: string;
  status: BookingStatus;
  technician: string;
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
  password?: string;
  role: 'admin' | 'technician';
}

interface Availability {
  fullyBookedDates: string[];
  bookedSlots?: string[];
}

// --- Photo Storage Helpers ---
export const savePhoto = (key: string, data: string): void => {
  try {
    localStorage.setItem(`${PHOTO_STORAGE_PREFIX}${key}`, data);
  } catch (error) {
    console.error(`Failed to save photo with key ${key} to localStorage`, error);
  }
};

export const getPhoto = (key: string): string | null => {
  try {
    return localStorage.getItem(`${PHOTO_STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.error(`Failed to retrieve photo with key ${key} from localStorage`, error);
    return null;
  }
};

// --- Data Simulasi ---
const generateInitialBookings = (): Booking[] => {
  const today = new Date();
  const yesterday = new Date(new Date().setDate(today.getDate() - 1));
  const twoDaysAgo = new Date(new Date().setDate(today.getDate() - 2));
  const tomorrow = new Date(new Date().setDate(today.getDate() + 1));
  const dayAfterTomorrow = new Date(new Date().setDate(today.getDate() + 2));
  const threeDaysFromNow = new Date(new Date().setDate(today.getDate() + 3));

  const bookings: Booking[] = [
    {
      id: 1,
      name: 'Joni',
      whatsapp: '089888820021',
      address: 'Puri Indah, Jakarta Barat',
      service: 'Perbaikan AC',
      startDate: twoDaysAgo.toISOString(),
      endDate: twoDaysAgo.toISOString(),
      time: '09:30',
      status: 'Completed',
      technician: 'Ahmad Yusuf',
      lat: -6.179326,
      lng: 106.751686,
      arrivalTime: new Date(new Date(twoDaysAgo).setHours(9, 25, 33)).toISOString(),
      startTime: new Date(new Date(twoDaysAgo).setHours(9, 40, 15)).toISOString(),
      endTime: new Date(new Date(twoDaysAgo).setHours(10, 55, 48)).toISOString(),
      workDurationMinutes: 75,
      photos: {
        arrival: '1-arrival',
        before: '1-before',
        after: '1-after',
      },
      note: 'Filter AC sangat kotor, perlu diganti pada service berikutnya. Pipa pembuangan juga dibersihkan dari lumut.',
      additionalCosts: 50000,
    },
    {
      id: 2,
      name: 'Budi Santoso',
      whatsapp: '081234567890',
      address: 'Jl. Merdeka No. 17, Jakarta Pusat',
      service: 'Servis Saluran Mampet',
      startDate: yesterday.toISOString(),
      endDate: yesterday.toISOString(),
      time: '14:00',
      status: 'On Site',
      technician: 'Bambang Wijoyo',
      lat: -6.17511,
      lng: 106.827225,
      arrivalTime: new Date(new Date(yesterday).setHours(14, 5, 0)).toISOString(),
      photos: {
        arrival: '2-arrival',
      },
    },
    {
      id: 3,
      name: 'Citra Lestari',
      whatsapp: '087712345678',
      address: 'Apartemen Cendana Tower B Lt. 15, Jakarta Pusat',
      service: 'General Cleaning',
      startDate: today.toISOString(),
      endDate: today.toISOString(),
      time: '11:00',
      status: 'Confirmed',
      technician: 'Tim Kebersihan A',
      lat: -6.18,
      lng: 106.822502,
    },
    {
      id: 4,
      name: 'Dewi Anggraini',
      whatsapp: '085611112222',
      address: 'Jl. Gatot Subroto Kav. 38, Jakarta Selatan',
      service: 'Cuci AC Rutin',
      startDate: tomorrow.toISOString(),
      endDate: tomorrow.toISOString(),
      time: '10:00',
      status: 'Confirmed',
      technician: 'Ahmad Yusuf',
      lat: -6.229728,
      lng: 106.822395,
    },
    {
      id: 5,
      name: 'Eko Prasetyo',
      whatsapp: '081199998888',
      address: 'Perumahan Cipinang Indah, Jakarta Timur',
      service: 'Instalasi Pipa Air',
      startDate: dayAfterTomorrow.toISOString(),
      endDate: threeDaysFromNow.toISOString(),
      time: '09:00',
      status: 'Confirmed',
      technician: 'Bambang Wijoyo',
      lat: -6.234394,
      lng: 106.903336,
    },
  ];

  savePhoto(
    '1-arrival',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&h=100&fit=crop',
  );
  savePhoto(
    '1-before',
    'https://images.unsplash.com/photo-1603013822817-1bb13ce59a74?w=100&h=100&fit=crop',
  );
  savePhoto(
    '1-after',
    'https://images.unsplash.com/photo-1598870150334-26ecf6311634?w=100&h=100&fit=crop',
  );
  savePhoto(
    '2-arrival',
    'https://images.unsplash.com/photo-1581822261290-991b38693d1b?w=100&h=100&fit=crop',
  );

  return bookings;
};

// --- Helpers ---
export const formatDateToKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseKeyToDate = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const generateTimeSlots = (
  startHour: number,
  endHour: number,
  breakStartHour: number,
  breakEndHour: number,
  intervalMinutes: number,
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
          .toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace('.', ':'),
      );
    }
    date.setMinutes(date.getMinutes() + intervalMinutes);
  }
  return slots;
};

// --- Bookings ---
export const getBookings = (): Booking[] => {
  try {
    const storedBookings = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (storedBookings) {
      const parsedBookings: Booking[] = JSON.parse(storedBookings);
      const bookingsWithDefaults = parsedBookings.map((b) => ({
        ...b,
        endDate: b.endDate || b.startDate,
        photos: b.photos || {},
        additionalWorkNotes: b.note || '',
        additionalCosts: b.additionalCosts || 0,
      }));
      bookingsWithDefaults.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime() || a.id - b.id,
      );
      return bookingsWithDefaults;
    } else {
      const initialData = generateInitialBookings();
      saveBookings(initialData);
      return initialData;
    }
  } catch (error) {
    console.error('Failed to load bookings from localStorage', error);
  }
  return [];
};

export const saveBookings = (bookings: Booking[]): void => {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error('Failed to save bookings to localStorage', error);
    alert('Gagal menyimpan data booking. Penyimpanan mungkin penuh.');
  }
};

// --- Availability ---
export const getAvailability = (): Availability => {
  try {
    const storedAvailability = localStorage.getItem(AVAILABILITY_STORAGE_KEY);
    if (storedAvailability) {
      return JSON.parse(storedAvailability);
    }
  } catch (error) {
    console.error('Failed to load availability from localStorage', error);
  }
  return {
    fullyBookedDates: Array.from(initialFullyBookedDates),
    bookedSlots: Array.from(initialBookedSlots),
  };
};

export const saveAvailability = (availability: Partial<Availability>): void => {
  try {
    const currentAvailability = getAvailability();
    const newAvailability = { ...currentAvailability, ...availability };
    localStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(newAvailability));
  } catch (error) {
    console.error('Failed to save availability to localStorage', error);
  }
};

// --- Services ---
export const getServices = (): ServiceCategory[] => {
  try {
    const storedServices = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (storedServices) {
      return JSON.parse(storedServices);
    } else {
      saveServices(initialServicesData);
      return initialServicesData;
    }
  } catch (error) {
    console.error('Failed to load services from localStorage', error);
    return initialServicesData;
  }
};

export const saveServices = (services: ServiceCategory[]): void => {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
  } catch (error) {
    console.error('Failed to save services to localStorage', error);
  }
};

// --- Users (Admin & Technicians) ---
const initialUsers: User[] = [
  { id: 0, name: 'Admin', username: 'admin', password: 'admin123', role: 'admin' },
  { id: 1, name: 'Ahmad Yusuf', username: 'ahmad', password: 'password123', role: 'technician' },
  {
    id: 2,
    name: 'Bambang Wijoyo',
    username: 'bambang',
    password: 'password123',
    role: 'technician',
  },
  {
    id: 3,
    name: 'Tim Kebersihan A',
    username: 'tim_a',
    password: 'password123',
    role: 'technician',
  },
  { id: 4, name: 'Tim Laundry B', username: 'tim_b', password: 'password123', role: 'technician' },
];

export const getUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    } else {
      saveUsers(initialUsers);
      return initialUsers;
    }
  } catch (error) {
    console.error('Failed to load users from localStorage', error);
    return initialUsers;
  }
};

export const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users to localStorage', error);
  }
};
