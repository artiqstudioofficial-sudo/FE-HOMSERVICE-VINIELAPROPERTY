import { BOOKING_STATUS_TO_API_CODE } from "@/components/utils/statusMapping";
import { BookingStatus } from "../../lib/storage";

const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_BASE_URL ||
  "https://api-homeservice.viniela.id";

export const ADMIN_API = `${API_BASE_URL}/api/v1/admin`;

export async function updateBookingStatusOnServer(
  formId: number,
  status: BookingStatus,
  userId: number
) {
  const statusCode =
    BOOKING_STATUS_TO_API_CODE[status] ?? BOOKING_STATUS_TO_API_CODE.Confirmed;

  const res = await fetch(`${ADMIN_API}/update-booking-status`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form_id: formId,
      user_id: userId,
      status: statusCode,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      `Gagal update status (status ${res.status})`;
    throw new Error(msg);
  }
}
