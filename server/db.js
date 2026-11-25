import 'dotenv/config';
import pg from 'pg';

// Пул з'єднань з базою даних PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;