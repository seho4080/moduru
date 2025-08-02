const { Pool } = require('pg');
require('dotenv').config(); // .env 파일에서 DB 정보 읽기
console.log('> DB_HOST:', process.env.DB_HOST);
console.log('> DB_PORT:', process.env.DB_PORT);
console.log('> DB_USER:', process.env.DB_USER);
console.log('> raw DB_PASSWORD:', JSON.stringify(process.env.DB_PASSWORD));
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port:Number(process.env.DB_PORT),
});
console.log('▶︎ DB_PASSWORD 타입:', typeof process.env.DB_PASSWORD);
module.exports = {
  query: (text, params) => pool.query(text, params),
};