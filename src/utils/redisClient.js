import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL // Uses localhost:6379
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

await redisClient.connect();

export default redisClient