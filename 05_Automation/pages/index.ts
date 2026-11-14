// Page Object Model: każda strona aplikacji ma własną klasę z lokatorami i akcjami.
// Fixture rozszerza test z helpers/audit.ts (evidence, asercje) o gotowe obiekty stron.
import { test as auditTest, expect } from '../helpers/audit';
import { HomePage } from './HomePage';
import { ContactForm } from './ContactForm';
import { ReservationPage } from './ReservationPage';
import { AdminLoginPage } from './AdminLoginPage';

type Pages = { home: HomePage; contactForm: ContactForm; reservation: ReservationPage; adminLogin: AdminLoginPage };

export const test = auditTest.extend<Pages>({
  home: async ({ page }, use) => use(new HomePage(page)),
  contactForm: async ({ page }, use) => use(new ContactForm(page)),
  reservation: async ({ page }, use) => use(new ReservationPage(page)),
  adminLogin: async ({ page }, use) => use(new AdminLoginPage(page)),
});
export { expect, HomePage, ContactForm, ReservationPage, AdminLoginPage };
