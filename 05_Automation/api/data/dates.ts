import type { Booking, BookingDates } from '../types';

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Termin 2 nocy zaczynający się `daysAhead` dni od dziś (UTC). */
export function futureStay(daysAhead = 60, nights = 2): BookingDates {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + daysAhead);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + nights);
  return { checkin: iso(start), checkout: iso(end) };
}

const overlaps = (a: BookingDates, b: BookingDates) => a.checkin < b.checkout && a.checkout > b.checkin;

/**
 * Pierwszy wolny termin na podstawie aktualnych rezerwacji: przesuwa okres o `stepDays`,
 * maksymalnie `attempts` razy. Zwraca null, gdy wolnego terminu nie ma (test -> BLOCKED).
 * Termin wybieramy z odczytanego stanu, bez ponawiania zapisu w razie konfliktu.
 */
export function findFreeStay(existing: Booking[], start: BookingDates = futureStay(), stepDays = 3, attempts = 120): BookingDates | null {
  const stay = { ...start };
  for (let i = 0; i < attempts; i++) {
    if (!existing.some((b) => overlaps(b.bookingdates, stay))) return stay;
    for (const key of ['checkin', 'checkout'] as const) {
      const d = new Date(stay[key]);
      d.setUTCDate(d.getUTCDate() + stepDays);
      stay[key] = iso(d);
    }
  }
  return null;
}
