import type { Locator, Page } from 'playwright/test';
import type { Audit } from '../helpers/audit';

export type ContactData = { name: string; email: any; phone: string; subject: string; description: string };
const FIELDS = ['name', 'email', 'phone', 'subject', 'description'] as const;

/** Formularz kontaktowy „Send Us a Message” na stronie głównej. */
export class ContactForm {
  readonly name: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly subject: Locator;
  readonly description: Locator;
  readonly submitButton: Locator;
  readonly errors: Locator;

  constructor(private readonly page: Page) {
    this.name = page.locator('#name');
    this.email = page.locator('#email');
    this.phone = page.locator('#phone');
    this.subject = page.locator('#subject');
    this.description = page.locator('#description');
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true });
    this.errors = page.locator('.alert-danger');
  }

  /** Wszystkie pola i przycisk – do screenshotu całego formularza. */
  get allFields() {
    return [this.name, this.email, this.phone, this.subject, this.description, this.submitButton];
  }

  async fill(data: ContactData) {
    for (const field of FIELDS) await this.page.locator(`#${field}`).fill(data[field]);
  }

  /** Klika „Submit”, zapisuje request/response w evidence i zwraca status oraz treść odpowiedzi. */
  async submit(a: Audit) {
    const waiting = this.page.waitForResponse((r) => r.url().endsWith('/api/message') && r.request().method() === 'POST');
    await this.submitButton.click();
    const r = await waiting;
    const body = await r.json();
    a.calls.push({ startedAt: new Date().toISOString(), request: { method: 'POST', url: r.url(), body: r.request().postDataJSON() }, response: { status: r.status(), body } });
    return { status: r.status(), body };
  }

  confirmation(name: string) {
    return this.page.getByText(`Thanks for getting in touch ${name}!`, { exact: true });
  }

  errorText(text: string) {
    return this.page.getByText(text, { exact: true });
  }
}
