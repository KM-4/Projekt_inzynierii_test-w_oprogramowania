import { test } from 'playwright/test';
import { BaseClient } from './BaseClient';
import { Endpoints } from '../endpoints';
import type { ApiResult, AuthSession } from '../types';

/** Logowanie: POST /api/auth/login. */
export class AuthClient extends BaseClient {
  login(username: unknown, password: unknown): Promise<ApiResult<{ token?: string; error?: string }>> {
    return this.request('POST', Endpoints.login, { username, password });
  }

  /**
   * Loguje administratora danymi z QA_USERNAME / QA_PASSWORD i zwraca sesję.
   * Bez tych zmiennych test kończy się statusem BLOCKED (skip z jawnym powodem).
   */
  async loginAsAdmin(): Promise<AuthSession> {
    test.skip(!process.env.QA_USERNAME || !process.env.QA_PASSWORD, 'BLOCKED: ustaw QA_USERNAME i QA_PASSWORD dla odczytu i sprzątania własnych danych.');
    const r = await this.login(process.env.QA_USERNAME, process.env.QA_PASSWORD);
    this.audit.check(r.status, 200, 'Logowanie API: HTTP 200');
    this.audit.check(typeof r.body.token, 'string', 'Otrzymano token');
    return { headers: { Cookie: `token=${r.body.token}` } };
  }
}
