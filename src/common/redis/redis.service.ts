import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isReady = false;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultTtl = Number(this.configService.get<number>('REDIS_DEFAULT_TTL')) || 900;
  }

  async onModuleInit() {
    const rawVal = this.configService.get<any>('REDIS_ENABLED');
    const isEnabled = String(rawVal).replace(/['"]/g, '').toLowerCase().trim() === 'true';

    if (!isEnabled) {
      this.logger.log('Redis is disabled (REDIS_ENABLED != true). Operating in direct PostgreSQL fail-safe mode.');
      return;
    }

    const host = this.configService.get<string>('REDIS_HOST') || '127.0.0.1';
    const port = Number(this.configService.get<number>('REDIS_PORT')) || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis reconnection retries exhausted. Disabling cache and falling back to PostgreSQL.');
            this.isReady = false;
            return null;
          }
          return Math.min(times * 1000, 3000);
        },
      });

      this.client.on('connect', () => {
        this.isReady = true;
        this.logger.log(`Connected to Redis server at ${host}:${port}`);
      });

      this.client.on('error', (err) => {
        this.isReady = false;
        this.logger.warn(`Redis connection error (${err.message}). Gracefully falling back to PostgreSQL.`);
      });

      await this.client.connect();
    } catch (err: any) {
      this.isReady = false;
      this.logger.warn(`Could not connect to Redis on startup (${err?.message || err}). Running with PostgreSQL direct query mode.`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (e) {
        // ignore disconnect errors
      }
    }
  }

  get isConnected(): boolean {
    return this.isReady;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady || !this.client) {
      return null;
    }
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: any) {
      this.logger.warn(`Redis GET failed for key "${key}": ${err.message}. Bypassing cache.`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isReady || !this.client) {
      return;
    }
    try {
      const serialized = JSON.stringify(value);
      const ttl = ttlSeconds ?? this.defaultTtl;
      if (ttl > 0) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err: any) {
      this.logger.warn(`Redis SET failed for key "${key}": ${err.message}.`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isReady || !this.client) {
      return;
    }
    try {
      await this.client.del(key);
    } catch (err: any) {
      this.logger.warn(`Redis DEL failed for key "${key}": ${err.message}.`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isReady || !this.client) {
      return;
    }
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err: any) {
      this.logger.warn(`Redis delByPattern failed for pattern "${pattern}": ${err.message}.`);
    }
  }
}

