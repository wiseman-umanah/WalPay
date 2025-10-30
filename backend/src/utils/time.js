export function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function toIso(date) {
  return new Date(date).toISOString();
}

