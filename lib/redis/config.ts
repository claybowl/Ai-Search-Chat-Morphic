import { Redis } from '@upstash/redis'
import { createClient, RedisClientType } from 'redis'

export type RedisConfig = {
  useLocalRedis: boolean
  upstashRedisRestUrl?: string
  upstashRedisRestToken?: string
  localRedisUrl?: string
}

export const redisConfig: RedisConfig = {
  useLocalRedis: process.env.USE_LOCAL_REDIS === 'true',
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  localRedisUrl: process.env.LOCAL_REDIS_URL || 'redis://localhost:6379'
}

let localRedisClient: RedisClientType | null = null
let redisWrapper: RedisWrapper | null = null

// Wrapper class for Redis client
export class RedisWrapper {
  private client: Redis | RedisClientType

  constructor(client: Redis | RedisClientType) {
    this.client = client
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: { rev: boolean }
  ): Promise<string[]> {
    let result: string[]
    if (this.client instanceof Redis) {
      result = await this.client.zrange(key, start, stop, options)
    } else {
      const redisClient = this.client as RedisClientType
      if (options?.rev) {
        result = await redisClient.zRange(key, start, stop, { REV: true })
      } else {
        result = await redisClient.zRange(key, start, stop)
      }
    }
    return result
  }

  async hgetall<T extends Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    if (this.client instanceof Redis) {
      return this.client.hgetall(key) as Promise<T | null>
    } else {
      const result = await (this.client as RedisClientType).hGetAll(key)
      return Object.keys(result).length > 0 ? (result as T) : null
    }
  }

  pipeline() {
    return this.client instanceof Redis
      ? new UpstashPipelineWrapper(this.client.pipeline())
      : new LocalPipelineWrapper((this.client as RedisClientType).multi())
  }

  async hmset(key: string, value: Record<string, any>): Promise<'OK' | number> {
    if (this.client instanceof Redis) {
      return this.client.hmset(key, value)
    } else {
      return (this.client as RedisClientType).hSet(key, value)
    }
  }

  async zadd(
    key: string,
    score: number,
    member: string
  ): Promise<number | null> {
    if (this.client instanceof Redis) {
      return this.client.zadd(key, { score, member })
    } else {
      return (this.client as RedisClientType).zAdd(key, {
        score,
        value: member
      })
    }
  }

  async del(key: string): Promise<number> {
    if (this.client instanceof Redis) {
      return this.client.del(key)
    } else {
      return (this.client as RedisClientType).del(key)
    }
  }

  async zrem(key: string, member: string): Promise<number> {
    if (this.client instanceof Redis) {
      return this.client.zrem(key, member)
    } else {
      return (this.client as RedisClientType).zRem(key, member)
    }
  }

  async close(): Promise<void> {
    if (this.client instanceof Redis) {
      // Upstash Redis doesn't require explicit closing
      return
    } else {
      await (this.client as RedisClientType).quit()
    }
  }
}

// Wrapper class for Upstash Redis pipeline
class UpstashPipelineWrapper {
  private pipeline: ReturnType<Redis['pipeline']>

  constructor(pipeline: ReturnType<Redis['pipeline']>) {
    this.pipeline = pipeline
  }

  hgetall(key: string) {
    this.pipeline.hgetall(key)
    return this
  }

  del(key: string) {
    this.pipeline.del(key)
    return this
  }

  zrem(key: string, member: string) {
    this.pipeline.zrem(key, member)
    return this
  }

  hmset(key: string, value: Record<string, any>) {
    this.pipeline.hmset(key, value)
    return this
  }

  zadd(key: string, score: number, member: string) {
    this.pipeline.zadd(key, { score, member })
    return this
  }

  async exec() {
    try {
      return await this.pipeline.exec()
    } catch (error) {
      throw error
    }
  }
}

// Wrapper class for local Redis pipeline
class LocalPipelineWrapper {
  private pipeline: ReturnType<RedisClientType['multi']>

  constructor(pipeline: ReturnType<RedisClientType['multi']>) {
    this.pipeline = pipeline
  }

  hgetall(key: string) {
    this.pipeline.hGetAll(key)
    return this
  }

  del(key: string) {
    this.pipeline.del(key)
    return this
  }

  zrem(key: string, member: string) {
    this.pipeline.zRem(key, member)
    return this
  }

  hmset(key: string, value: Record<string, any>) {
    // Convert all values to strings
    const stringValue = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, String(v)])
    )
    this.pipeline.hSet(key, stringValue)
    return this
  }

  zadd(key: string, score: number, member: string) {
    this.pipeline.zAdd(key, { score, value: member })
    return this
  }

  async exec() {
    try {
      return await this.pipeline.exec()
    } catch (error) {
      throw error
    }
  }
}

// Function to get a Redis client
// Memory-based implementation for when Redis is not available
class MemoryRedisWrapper extends RedisWrapper {
  private storage: Map<string, any> = new Map();
  private sortedSets: Map<string, Map<string, number>> = new Map();

  constructor() {
    // Using 'any' as a placeholder since we don't have a real Redis client
    super({} as any);
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: { rev: boolean }
  ): Promise<string[]> {
    const set = this.sortedSets.get(key) || new Map();
    const entries = [...set.entries()];
    
    // Sort by score
    entries.sort((a, b) => options?.rev ? b[1] - a[1] : a[1] - b[1]);
    
    // Extract members based on start/stop indices
    const actualStop = stop === -1 ? entries.length - 1 : stop;
    return entries.slice(start, actualStop + 1).map(([member]) => member);
  }

  async hgetall<T extends Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    return (this.storage.get(key) as T) || null;
  }

  pipeline() {
    return new MemoryPipelineWrapper(this);
  }

  async hmset(key: string, value: Record<string, any>): Promise<'OK' | number> {
    this.storage.set(key, value);
    return 'OK';
  }

  async zadd(
    key: string,
    score: number,
    member: string
  ): Promise<number | null> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    const isNew = !set.has(member);
    set.set(member, score);
    return isNew ? 1 : 0;
  }

  async del(key: string): Promise<number> {
    const existed = this.storage.has(key);
    this.storage.delete(key);
    this.sortedSets.delete(key);
    return existed ? 1 : 0;
  }

  async zrem(key: string, member: string): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set || !set.has(member)) return 0;
    set.delete(member);
    return 1;
  }

  async close(): Promise<void> {
    // No-op for memory implementation
  }
}

class MemoryPipelineWrapper {
  private operations: { op: string; args: any[] }[] = [];
  private wrapper: MemoryRedisWrapper;

  constructor(wrapper: MemoryRedisWrapper) {
    this.wrapper = wrapper;
  }

  hgetall(key: string) {
    this.operations.push({ op: 'hgetall', args: [key] });
    return this;
  }

  del(key: string) {
    this.operations.push({ op: 'del', args: [key] });
    return this;
  }

  zrem(key: string, member: string) {
    this.operations.push({ op: 'zrem', args: [key, member] });
    return this;
  }

  hmset(key: string, value: Record<string, any>) {
    this.operations.push({ op: 'hmset', args: [key, value] });
    return this;
  }

  zadd(key: string, score: number, member: string) {
    this.operations.push({ op: 'zadd', args: [key, score, member] });
    return this;
  }

  async exec() {
    const results = [];
    for (const op of this.operations) {
      switch (op.op) {
        case 'hgetall':
          results.push(await this.wrapper.hgetall(op.args[0]));
          break;
        case 'del':
          results.push(await this.wrapper.del(op.args[0]));
          break;
        case 'zrem':
          results.push(await this.wrapper.zrem(op.args[0], op.args[1]));
          break;
        case 'hmset':
          results.push(await this.wrapper.hmset(op.args[0], op.args[1]));
          break;
        case 'zadd':
          results.push(await this.wrapper.zadd(op.args[0], op.args[1], op.args[2]));
          break;
      }
    }
    return results;
  }
}

export async function getRedisClient(): Promise<RedisWrapper> {
  if (redisWrapper) {
    return redisWrapper
  }

  // Check if Redis is configured
  const isRedisConfigured = redisConfig.useLocalRedis || 
    (redisConfig.upstashRedisRestUrl && redisConfig.upstashRedisRestToken);

  if (!isRedisConfigured) {
    console.warn("Redis is not configured. Using in-memory storage for chat history (will be lost on server restart).");
    redisWrapper = new MemoryRedisWrapper();
    return redisWrapper;
  }

  if (redisConfig.useLocalRedis) {
    if (!localRedisClient) {
      const localRedisUrl =
        redisConfig.localRedisUrl || 'redis://localhost:6379'
      try {
        localRedisClient = createClient({ url: localRedisUrl })
        await localRedisClient.connect()
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('ECONNREFUSED')) {
            console.error(
              `Failed to connect to local Redis at ${localRedisUrl}: Connection refused. Is Redis running?`
            )
          } else if (error.message.includes('ETIMEDOUT')) {
            console.error(
              `Failed to connect to local Redis at ${localRedisUrl}: Connection timed out. Check your network or Redis server.`
            )
          } else if (error.message.includes('ENOTFOUND')) {
            console.error(
              `Failed to connect to local Redis at ${localRedisUrl}: Host not found. Check your Redis URL.`
            )
          } else {
            console.error(
              `Failed to connect to local Redis at ${localRedisUrl}:`,
              error.message
            )
          }
        } else {
          console.error(
            `An unexpected error occurred while connecting to local Redis at ${localRedisUrl}:`,
            error
          )
        }
        console.warn("Falling back to in-memory storage for chat history.");
        redisWrapper = new MemoryRedisWrapper();
        return redisWrapper;
      }
    }
    redisWrapper = new RedisWrapper(localRedisClient)
  } else {
    try {
      redisWrapper = new RedisWrapper(
        new Redis({
          url: redisConfig.upstashRedisRestUrl!,
          token: redisConfig.upstashRedisRestToken!
        })
      )
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('unauthorized')) {
          console.error(
            'Failed to connect to Upstash Redis: Unauthorized. Check your Upstash Redis token.'
          )
        } else if (error.message.includes('not found')) {
          console.error(
            'Failed to connect to Upstash Redis: URL not found. Check your Upstash Redis URL.'
          )
        } else {
          console.error('Failed to connect to Upstash Redis:', error.message)
        }
      } else {
        console.error(
          'An unexpected error occurred while connecting to Upstash Redis:',
          error
        )
      }
      console.warn("Falling back to in-memory storage for chat history.");
      redisWrapper = new MemoryRedisWrapper();
      return redisWrapper;
    }
  }

  return redisWrapper
}

// Function to close the Redis connection
export async function closeRedisConnection(): Promise<void> {
  if (redisWrapper) {
    await redisWrapper.close()
    redisWrapper = null
  }
  if (localRedisClient) {
    await localRedisClient.quit()
    localRedisClient = null
  }
}
