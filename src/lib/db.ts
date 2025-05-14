import { Pool } from 'pg';
import config from './config';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.env === 'production' || config.env === 'staging' ? { rejectUnauthorized: false } : false,
  max: config.database.maxConnections,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

// Test the database connection
pool.on('connect', () => {
  if (config.env !== 'test') {
    console.log(`Connected to PostgreSQL database in ${config.env} environment`);
  }
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  if (config.env !== 'test') {
    process.exit(-1);
  }
});

// Database interface
const db = {
  /**
   * Execute a query on the database
   * @param text SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  query: (text: string, params?: any[]) => pool.query(text, params),

  /**
   * Get a client from the pool
   * @returns Database client
   */
  getClient: () => pool.connect(),

  /**
   * Check database connection
   * @returns True if connected, false otherwise
   */
  checkConnection: async (): Promise<boolean> => {
    try {
      const client = await pool.connect();
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  },

  /**
   * Close all pool connections
   */
  close: async (): Promise<void> => {
    await pool.end();
  }
};

export default db;
