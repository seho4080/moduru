require('dotenv').config();    // index.js에서 이미 했다면 생략해도 무방

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  // password: process.env.REDIS_PASSWORD, // 필요하면
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});
redis.on('error', (err) => {
  console.error('❌ Redis error', err);
});

module.exports = redis;