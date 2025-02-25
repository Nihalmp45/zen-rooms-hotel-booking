import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../utils/redisClient.js";

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args), // ✅ FIXED
  }),
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 requests per `windowMs`
  message: { error: "Too many requests, please try again later." },
  statusCode: 429, // Too many requests
});

export default limiter;
