import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Clear broken image URLs from service cards
await conn.execute(
  "UPDATE serviceCards SET imageUrl = '' WHERE imageUrl LIKE '%d2xsxph8kpxj0f.cloudfront.net%'"
);
console.log('✅ Cleared broken image URLs from service cards');

await conn.end();
