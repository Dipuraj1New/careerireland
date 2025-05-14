/**
 * Database migration tests
 */
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import runMigrations from '@/db/migrate';

describe('Database Migrations', () => {
  // Close database connection after all tests
  afterAll(async () => {
    await db.close();
  });

  test('should have valid SQL migration files', () => {
    // Get migration files
    const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Assert that we have migration files
    expect(migrationFiles.length).toBeGreaterThan(0);
    
    // Check each migration file
    migrationFiles.forEach(file => {
      // Read migration file
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Assert that the file has content
      expect(sql.length).toBeGreaterThan(0);
      
      // Assert that the file has valid SQL (basic check)
      expect(sql).toMatch(/CREATE|ALTER|DROP|INSERT|UPDATE|DELETE/i);
    });
  });

  test('should run migrations successfully', async () => {
    // Run migrations
    await runMigrations();
    
    // Check if migrations table exists and has records
    const { rows } = await db.query('SELECT COUNT(*) as count FROM migrations');
    
    // Assert
    expect(parseInt(rows[0].count)).toBeGreaterThan(0);
  });

  test('should have all required tables after migrations', async () => {
    // List of tables that should exist after migrations
    const requiredTables = ['users', 'cases', 'documents', 'audit_logs', 'migrations'];
    
    // Check each table
    for (const table of requiredTables) {
      const { rows } = await db.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists`,
        [table]
      );
      
      // Assert that the table exists
      expect(rows[0].exists).toBe(true);
    }
  });
});
