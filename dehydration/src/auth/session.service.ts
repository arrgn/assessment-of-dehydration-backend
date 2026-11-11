import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';

export const SESSION_COOKIE = 'sessionId';
export const SESSION_TTL_SEC = 60 * 60;

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis({
      host: config.get('REDIS_HOST', 'localhost'),
      port: Number(config.get('REDIS_PORT', 6379)),
    });
  }

  async create(userId: number): Promise<string> {
    const sessionId = randomUUID();
    await this.redis.setex(this.key(sessionId), SESSION_TTL_SEC, `${userId}`);
    return sessionId;
  }

  async getUserId(sessionId: string): Promise<number | null> {
    const value = await this.redis.get(this.key(sessionId));
    return value ? Number.parseInt(value, 10) : null;
  }

  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(this.key(sessionId));
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private key(sessionId: string): string {
    return `session:${sessionId}`;
  }
}
