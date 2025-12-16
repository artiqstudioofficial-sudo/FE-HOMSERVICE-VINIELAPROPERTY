export function formatScheduleYYYYMMDD(
  startDateInput: string,
  endDateInput: string,
  time: string
) {
  const start = startDateInput?.slice(0, 10);
  const end = endDateInput?.slice(0, 10);

  const isMultiDay = start !== end;
  if (!isMultiDay) return `${start} - ${time}`;
  return `${start} s/d ${end}`;
}
