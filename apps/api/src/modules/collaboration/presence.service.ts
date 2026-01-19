import { Injectable, Logger } from '@nestjs/common';

interface UserPresence {
  oderId: string;
  name: string;
  avatar?: string;
  currentPage?: string;
  currentRecordId?: string;
  lastSeen: Date;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly presence: Map<string, UserPresence> = new Map();

  updatePresence(
    userId: string,
    data: Partial<UserPresence>,
  ): void {
    const existing = this.presence.get(userId) || { oderId: userId, name: '', lastSeen: new Date() };
    this.presence.set(userId, {
      ...existing,
      ...data,
      lastSeen: new Date(),
    });
  }

  removePresence(userId: string): void {
    this.presence.delete(userId);
  }

  getOnlineUsers(): UserPresence[] {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    // Clean up stale presences
    for (const [userId, presence] of this.presence.entries()) {
      if (now - presence.lastSeen.getTime() > timeout) {
        this.presence.delete(userId);
      }
    }

    return Array.from(this.presence.values());
  }

  getUsersOnRecord(recordId: string): UserPresence[] {
    return Array.from(this.presence.values()).filter(
      (p) => p.currentRecordId === recordId,
    );
  }

  getUsersOnPage(page: string): UserPresence[] {
    return Array.from(this.presence.values()).filter(
      (p) => p.currentPage === page,
    );
  }
}
