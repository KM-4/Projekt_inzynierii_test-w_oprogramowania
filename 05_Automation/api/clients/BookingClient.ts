import { BaseClient } from './BaseClient';
import { Endpoints } from '../endpoints';
import type { ApiResult, AuthSession, Booking, BookingPayload } from '../types';

/** Rezerwacje: GET/POST /api/booking oraz GET/PUT/DELETE /api/booking/{id}. */
export class BookingClient extends BaseClient {
  /** Rezerwacje pokoju; wymaga sesji administratora (bez niej API zwraca 401). */
  listForRoom(roomid: number, session?: AuthSession): Promise<ApiResult<{ bookings?: Booking[]; error?: string } & Booking[]>> {
    return this.request('GET', Endpoints.bookingsForRoom(roomid), undefined, session);
  }

  /** Tworzy rezerwację tak jak gość (bez logowania). */
  create(payload: BookingPayload): Promise<ApiResult> {
    return this.request('POST', Endpoints.bookings, payload);
  }

  get(id: number, session: AuthSession): Promise<ApiResult<Booking>> {
    return this.request('GET', Endpoints.booking(id), undefined, session);
  }

  update(id: number, payload: BookingPayload, session: AuthSession): Promise<ApiResult> {
    return this.request('PUT', Endpoints.booking(id), payload, session);
  }

  delete(id: number, session: AuthSession): Promise<ApiResult> {
    return this.request('DELETE', Endpoints.booking(id), undefined, session);
  }

  /** Normalizuje odpowiedź listy (API zwraca obiekt { bookings } albo tablicę). */
  static bookingsOf(body: any): Booking[] {
    return body?.bookings || body || [];
  }
}
