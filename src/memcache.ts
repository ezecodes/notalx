import dotenv from "dotenv";
dotenv.config();
import Memcached from "memcached";

const MEMCACHED_SERVERS = process.env.MEMCACHED_SERVERS?.split(",")!;

// Options for Memcached
const MEMCACHED_OPTIONS: Memcached.options = {
  retries: 3, // Number of retries before failure
  retry: 10000, // Wait time before retrying in ms
  remove: true, // Remove from pool on failure
  timeout: 5000, // Request timeout in ms
};

class MemcachedService {
  private client: Memcached;

  constructor() {
    this.client = new Memcached(MEMCACHED_SERVERS, MEMCACHED_OPTIONS);
  }

  ping = () => {
    return this.client.stats;
  };

  async set<T>(key: string, value: T, lifetime: number = 3600): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, lifetime, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) return reject(err);
        resolve(data as T | null);
      });
    });
  }

  async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  shutdown(): void {
    this.client.end();
  }
}

const memcachedService = new MemcachedService();
export default memcachedService;
