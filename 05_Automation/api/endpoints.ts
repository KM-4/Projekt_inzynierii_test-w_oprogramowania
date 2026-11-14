// Ścieżki publicznego API (proxy /api/* aplikacji Restful-Booker-Platform) w jednym miejscu.
export const Endpoints = {
  login: '/api/auth/login',
  rooms: '/api/room',
  room: (id: number) => `/api/room/${id}`,
  messages: '/api/message',
  message: (id: number) => `/api/message/${id}`,
  bookings: '/api/booking',
  bookingsForRoom: (roomid: number) => `/api/booking?roomid=${roomid}`,
  booking: (id: number) => `/api/booking/${id}`,
} as const;
