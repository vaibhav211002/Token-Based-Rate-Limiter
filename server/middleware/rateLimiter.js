const redis = require("../config/redis");
const ApiKey = require("../models/ApiKey");

const rateLimiter = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    console.log(" we are in the ratelimiter");
    
    if (!apiKey) {
      return res.status(401).json({
        message: "API Key is required",
      });
    }

    const config = await ApiKey.findOne({ apiKey });

    if (!config) {
      return res.status(401).json({
        message: "Invalid API Key",
      });
    }

    const redisKey = `bucket:${apiKey}`;

    let bucket = await redis.get(redisKey);

    if (!bucket) {
      bucket = {
        tokens: config.capacity,
        lastRefill: Date.now(),
      };
    } else {
      bucket = JSON.parse(bucket);
    }

    const now = Date.now();

    const elapsedTime = (now - bucket.lastRefill) / 1000;

    const tokensToAdd = Math.floor(elapsedTime * config.refillRate);

    bucket.tokens = Math.min(
      config.capacity,
      bucket.tokens + tokensToAdd
    );

    bucket.lastRefill = now;

    console.log("----------------------");
    console.log("Before Consume:", bucket.tokens);
    console.log("Elapsed:", elapsedTime);
    console.log("Tokens Added:", tokensToAdd);
    
    if (bucket.tokens < 1) {
      await redis.set(redisKey, JSON.stringify(bucket));

      return res.status(429).json({
        message: "Rate Limit Exceeded",
        tokensLeft : bucket.tokens ,
      });
    }

    bucket.tokens--;

    console.log("After Consume:", bucket.tokens);


    await redis.set(redisKey, JSON.stringify(bucket));
    req.tokensLeft = bucket.tokens ;

    next();
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = rateLimiter;