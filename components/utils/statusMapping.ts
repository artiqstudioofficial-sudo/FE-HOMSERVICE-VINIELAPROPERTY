import { BookingStatus } from "../../lib/storage";

export const BOOKING_STATUS_TO_API_CODE: Record<BookingStatus, number> = {
  Confirmed: 1,
  "On Site": 2,
  "In Progress": 3,
  Completed: 4,
  Cancelled: 5,
};
