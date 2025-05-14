/**
 * Database connection tests
 */
import db from '@/lib/db';
import config from '@/lib/config';

describe('Database Connection', () => {
  // Close database connection after all tests
  afterAll(async () => {
    await db.close();
  });

  test('should connect to the database successfully', async () => {
    // Check connection
    const connected = await db.checkConnection();
    
    // Assert
    expect(connected).toBe(true);
  });

  test('should execute a simple query successfully', async () => {
    // Execute query
    const result = await db.query('SELECT 1 as number');
    
    // Assert
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].number).toBe(1);
  });

  test('should use the correct database configuration', () => {
    // Assert that we're using the test database in test environment
    expect(config.env).toBe('test');
    expect(config.database.url).toBeDefined();
  });
});
