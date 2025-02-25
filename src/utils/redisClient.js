import Redis from "ioredis"

// Initialize Redis Client
const redisClient = new Redis({
  host: "127.0.0.1", // Redis server hostname
  port: 6379,        // Redis server port
  // password: "your_redis_password", // Uncomment if Redis requires authentication
});

// Handle Redis connection errors
redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

// Handle successful connection
redisClient.on("connect", () => {
  console.log("✅ Connected to Redis!");
});

// Export Redis client for use in other files
export default redisClient