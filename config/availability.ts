// config/availability.ts

/**
 * Helper function to format a date into a 'YYYY-MM-DD' string key.
 * NOTE: This function is now also used in storage.ts. Consider moving to a shared util file.
 */
const formatDateToKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- PENGATURAN AWAL JADWAL BOOKING ---
// Data di bawah ini hanya digunakan sebagai CONTOH atau data AWAL 
// jika belum ada pengaturan yang disimpan oleh Admin di localStorage.
// Pengelolaan jadwal sesungguhnya sekarang dilakukan melalui Dashboard Admin.

const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));
const fiveDaysFromNow = new Date(new Date().setDate(new Date().getDate() + 5));

/**
 * INITIAL BOOKED SLOTS (Contoh)
 * Format: 'YYYY-MM-DD-HH:MM'
 */
export const initialBookedSlots = new Set<string>([
    // Contoh slot yang sudah dipesan untuk demo
    `${formatDateToKey(tomorrow)}-10:30`,
]);

/**
 * INITIAL FULLY BOOKED DATES (Contoh)
 * Format: 'YYYY-MM-DD'
 */
export const initialFullyBookedDates = new Set<string>([
    // Contoh tanggal yang penuh untuk demo
    formatDateToKey(fiveDaysFromNow),
]);
