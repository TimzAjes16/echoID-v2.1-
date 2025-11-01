import pg from 'pg';
import dotenv from 'dotenv';
import { createTables } from './schema.js';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'user'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'echoid'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Initialize database connection and create tables
 */
export async function initDatabase() {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    
    // Create tables
    await createTables(pool);
    
    return pool;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Get database pool
 */
export function getPool() {
  return pool;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  await pool.end();
}

export default pool;

