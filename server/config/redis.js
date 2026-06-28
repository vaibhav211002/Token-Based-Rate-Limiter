const Redis = require("ioredis");

let redis;

try {
    redis = process.env.REDIS_URL
        ? new Redis(process.env.REDIS_URL)
        : new Redis({
              host: "redis://127.0.0.1:6379",
              port: 6379,
          });

    redis.on("connect", () => {
        console.log("✅ Redis connected");
    });

    redis.on("error", (err) => {
        console.error("❌ Redis Error:", err.message);
    });

} catch (err) {
    console.error("❌ Failed to initialize Redis:", err.message);
}

module.exports = redis;