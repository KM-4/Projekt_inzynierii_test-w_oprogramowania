import type { Locator, Page } from 'playwright/test';

/** Logowanie do panelu administratora: /admin */
export class AdminLoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByRole('textbox', { name: 'Username', exact: true });
    this.password = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    this.error = page.getByText(/Invalid credentials/i);
  }

  async open() {
    await this.page.goto('/admin');
  }

  async fill(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  /** Klika „Login” i zwraca odpowiedź POST /api/auth/login. */
  async submit() {
    const response = this.page.waitForResponse((r) => r.url().includes('/api/auth/login'));
    await this.loginButton.click();
    return response;
  }
}
