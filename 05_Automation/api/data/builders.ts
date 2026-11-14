// Test Data Builders: poprawne dane domyślne + nadpisanie tylko tego, co dany test zmienia.
import { randomUUID } from 'node:crypto';
import type { BookingDates, BookingPayload, MessagePayload } from '../types';

/** Unikalny znacznik własnych rekordów QA (np. imię nadawcy), żeby nie dotykać cudzych danych. */
export const uniqueMarker = () => `QA-${Date.now()}-${randomUUID().slice(0, 6)}`;

/** Poprawna wiadomość kontaktowa; `overrides` podmienia wybrane pola (np. błędny email). */
export function buildMessage(name = uniqueMarker(), overrides: Partial<Record<keyof MessagePayload, unknown>> = {}): MessagePayload {
  return {
    name,
    email: 'qa-project@example.test',
    phone: '12345678901',
    subject: `Zapytanie ${name}`,
    description: 'Wiadomość testowa projektu akademickiego. Dane syntetyczne.',
    ...overrides,
  } as MessagePayload;
}

/** Poprawna rezerwacja gościa dla pokoju i terminu; `overrides` podmienia wybrane pola. */
export function buildBooking(roomid: number, bookingdates: BookingDates, overrides: Partial<BookingPayload> = {}): BookingPayload {
  return {
    roomid,
    firstname: `QA${Date.now().toString().slice(-9)}`,
    lastname: 'ProjektTestowy',
    depositpaid: false,
    bookingdates,
    email: 'qa-project@example.test',
    phone: '12345678901',
    ...overrides,
  };
}
