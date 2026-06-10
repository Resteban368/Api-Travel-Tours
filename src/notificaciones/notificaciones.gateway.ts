import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface NotificacionPayload {
  id?: number;
  titulo?: string;
  mensaje: string;
  tipo: string;
  leida?: boolean;
  created_at?: string;
}

@Injectable()
export class NotificacionesGateway {
  private readonly streams = new Map<number, Subject<MessageEvent>>();

  getStream(userId: number): Observable<MessageEvent> {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<MessageEvent>());
    }
    return this.streams.get(userId)!.asObservable();
  }

  pushToUser(userId: number, data: NotificacionPayload): void {
    const subject = this.streams.get(userId);
    if (subject) {
      subject.next({ data } as MessageEvent);
    }
  }

  pushToAll(data: NotificacionPayload): void {
    this.streams.forEach((subject) => subject.next({ data } as MessageEvent));
  }

  removeStream(userId: number): void {
    this.streams.get(userId)?.complete();
    this.streams.delete(userId);
  }

  isConnected(userId: number): boolean {
    return this.streams.has(userId);
  }
}
