// Warstwa testów API: fixture podaje testowi gotowych klientów API (api.auth, api.rooms, api.messages, api.bookings).
// Klienci wywołują HTTP przez Audit (evidence), test zawiera scenariusz i jawne asercje.
import { test as auditTest, expect } from '../helpers/audit';
import { AuthClient } from './clients/AuthClient';
import { RoomClient } from './clients/RoomClient';
import { MessageClient } from './clients/MessageClient';
import { BookingClient } from './clients/BookingClient';

export type ApiClients = { auth: AuthClient; rooms: RoomClient; messages: MessageClient; bookings: BookingClient };

export const test = auditTest.extend<{ api: ApiClients }>({
  api: async ({ audit }, use) => {
    await use({ auth: new AuthClient(audit), rooms: new RoomClient(audit), messages: new MessageClient(audit), bookings: new BookingClient(audit) });
  },
});
export { expect, AuthClient, RoomClient, MessageClient, BookingClient };
export { Endpoints } from './endpoints';
export * from './data/builders';
export * from './data/dates';
export type { ApiResult, AuthSession, Room, MessagePayload, MessageSummary, BookingDates, BookingPayload, Booking } from './types';
