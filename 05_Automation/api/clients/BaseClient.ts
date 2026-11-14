import type { Audit } from '../../helpers/audit';
import type { ApiResult, AuthSession } from '../types';

/**
 * Wspólna baza klientów API. Każde wywołanie przechodzi przez Audit, który zapisuje
 * request, response i status w evidence (z maskowaniem sekretów).
 * Klienci nie wykonują asercji – decyzja o wyniku należy do testu.
 */
export abstract class BaseClient {
  constructor(protected readonly audit: Audit) {}

  protected async request<T = any>(method: string, path: string, body?: unknown, session?: AuthSession): Promise<ApiResult<T>> {
    const r = await this.audit.call(method, path, body, session?.headers);
    return { status: r.status, body: r.body as T };
  }
}
