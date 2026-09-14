import { redis } from '../config/redis.js';

export const getCache = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key, value, ttlSeconds = 3600) => {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
};

export const clearCache = async (keyPattern) => {
  const keys = await redis.keys(keyPattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
