import { expect, type Locator, type Page } from 'playwright/test';

/** Strona główna: katalog pokoi i wyszukiwarka dostępności. */
export class HomePage {
  readonly roomsHeading: Locator;
  readonly dateInputs: Locator;
  readonly checkAvailabilityButton: Locator;

  constructor(private readonly page: Page) {
    this.roomsHeading = page.getByRole('heading', { name: 'Our Rooms', exact: true });
    this.dateInputs = page.locator('.react-datepicker__input-container input');
    this.checkAvailabilityButton = page.getByRole('button', { name: 'Check Availability', exact: true });
  }

  async open() {
    await this.page.goto('/');
    await expect(this.roomsHeading).toBeVisible();
  }

  roomHeading(type: string) {
    return this.page.getByRole('heading', { name: type, exact: true });
  }

  roomPrice(price: number) {
    return this.page.getByText(`£${price} per night`, { exact: true });
  }

  bookLink(roomid: number) {
    return this.page.locator(`a[href^="/reservation/${roomid}?"]`);
  }

  /** Wpisuje daty w formacie DD/MM/YYYY (wejście: YYYY-MM-DD). */
  async setDates(checkin: string, checkout: string) {
    const toUi = (d: string) => d.split('-').reverse().join('/');
    await this.dateInputs.nth(0).fill(toUi(checkin));
    await this.dateInputs.nth(0).press('Tab');
    await this.dateInputs.nth(1).fill(toUi(checkout));
    await this.dateInputs.nth(1).press('Tab');
  }

  /** Klika „Check Availability” i zwraca odpowiedź GET /api/room?checkin=…&checkout=… */
  async checkAvailability() {
    const response = this.page.waitForResponse((r) => r.url().includes('/api/room?'));
    await this.checkAvailabilityButton.click();
    return response;
  }
}
