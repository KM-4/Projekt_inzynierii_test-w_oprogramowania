import type { Locator, Page } from 'playwright/test';

export type GuestData = { Firstname: string; Lastname: string; Email: string; Phone: string };

/** Strona rezerwacji pokoju: /reservation/<roomid>?checkin=…&checkout=… */
export class ReservationPage {
  readonly reserveButton: Locator;
  readonly alerts: Locator;

  constructor(private readonly page: Page) {
    this.reserveButton = page.getByRole('button', { name: 'Reserve Now', exact: true });
    this.alerts = page.getByRole('alert');
  }

  async open(roomid: number, checkin: string, checkout: string) {
    await this.page.goto(`/reservation/${roomid}?checkin=${checkin}&checkout=${checkout}`);
  }

  priceLine(price: number, nights: number) {
    return this.page.getByText(`£${price} x ${nights} nights`, { exact: true });
  }

  total(amount: number) {
    return this.page.getByText(`£${amount}`, { exact: true });
  }

  async fillGuest(data: GuestData) {
    for (const [field, value] of Object.entries(data)) await this.page.getByRole('textbox', { name: field, exact: true }).fill(value);
  }

  /** Drugie „Reserve Now” wysyła rezerwację; zwraca odpowiedź POST /api/booking. */
  async submitBooking() {
    const response = this.page.waitForResponse((r) => r.url().endsWith('/api/booking') && r.request().method() === 'POST');
    await this.reserveButton.click();
    return response;
  }
}
