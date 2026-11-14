import { BaseClient } from './BaseClient';
import { Endpoints } from '../endpoints';
import type { ApiResult, Room } from '../types';

/** Pokoje: GET /api/room, GET /api/room/{id}. */
export class RoomClient extends BaseClient {
  list(): Promise<ApiResult<{ rooms: Room[] }>> {
    return this.request('GET', Endpoints.rooms);
  }

  get(id: number): Promise<ApiResult<Room>> {
    return this.request('GET', Endpoints.room(id));
  }

  /** Pierwszy pokój z bieżącej listy (bez stałych ID); sprawdza, że lista jest dostępna i niepusta. */
  async firstListed(): Promise<Room> {
    const r = await this.list();
    this.audit.check(r.status, 200, 'Lista pokoi HTTP 200');
    this.audit.check(r.body.rooms.length > 0, true, 'Jest pokój do testu');
    return r.body.rooms[0];
  }
}
