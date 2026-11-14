import { BaseClient } from './BaseClient';
import { Endpoints } from '../endpoints';
import type { ApiResult, AuthSession, MessagePayload, MessageSummary } from '../types';

/** Wiadomości: POST/GET /api/message oraz GET/PUT/DELETE /api/message/{id}. */
export class MessageClient extends BaseClient {
  /** Wysyła payload bez modyfikacji (także celowo niepoprawny w testach negatywnych). */
  create(payload: MessagePayload | Record<string, unknown>): Promise<ApiResult> {
    return this.request('POST', Endpoints.messages, payload);
  }

  list(): Promise<ApiResult<{ messages: MessageSummary[] }>> {
    return this.request('GET', Endpoints.messages);
  }

  get(id: number, session: AuthSession): Promise<ApiResult> {
    return this.request('GET', Endpoints.message(id), undefined, session);
  }

  /** Oznacza wiadomość jako przeczytaną (PUT /api/message/{id}). */
  markRead(id: number, session: AuthSession): Promise<ApiResult> {
    return this.request('PUT', Endpoints.message(id), undefined, session);
  }

  delete(id: number, session: AuthSession): Promise<ApiResult> {
    return this.request('DELETE', Endpoints.message(id), undefined, session);
  }

  /** Wiadomości z danym nadawcą (unikalny znacznik QA) z bieżącej listy. */
  async findByName(name: string): Promise<MessageSummary[]> {
    const r = await this.list();
    return (r.body.messages || []).filter((m) => m.name === name);
  }
}
