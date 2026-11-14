// Typy domenowe i kontrakt odpowiedzi API używane w testach.

/** Wynik wywołania: status HTTP i sparsowana treść odpowiedzi (JSON albo tekst). */
export type ApiResult<T = any> = { status: number; body: T };

/** Sesja administratora: nagłówki z tokenem (ciasteczko `token`). */
export type AuthSession = { headers: Record<string, string> };

export type Room = {
  roomid: number;
  roomName: string;
  type: string;
  accessible: boolean;
  features: string[];
  roomPrice: number;
  image?: string;
  description?: string;
};

export type MessagePayload = { name: string; email: any; phone: string; subject: string; description: string };
export type MessageSummary = { id: number; name: string; subject: string; read: boolean };

export type BookingDates = { checkin: string; checkout: string };
export type BookingPayload = {
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: BookingDates;
  email: string;
  phone: string;
};
export type Booking = Omit<BookingPayload, 'email' | 'phone'> & { bookingid: number };
