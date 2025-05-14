/**
 * Environment configuration tests
 */
import fs from 'fs';
import path from 'path';

describe('Environment Configuration', () => {
  const rootDir = process.cwd();
  
  it('should have development environment file', () => {
    // Check if .env.development file exists
    const envPath = path.join(rootDir, '.env.development');
    const exists = fs.existsSync(envPath);
    
    // Assert
    expect(exists).toBe(true);
  });
  
  it('should have staging environment file', () => {
    // Check if .env.staging file exists
    const envPath = path.join(rootDir, '.env.staging');
    const exists = fs.existsSync(envPath);
    
    // Assert
    expect(exists).toBe(true);
  });
  
  it('should have production environment file', () => {
    // Check if .env.production file exists
    const envPath = path.join(rootDir, '.env.production');
    const exists = fs.existsSync(envPath);
    
    // Assert
    expect(exists).toBe(true);
  });
  
  it('should have required variables in development environment', () => {
    // Read .env.development file
    const envPath = path.join(rootDir, '.env.development');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for required variables
    expect(envContent).toContain('DATABASE_URL=');
    expect(envContent).toContain('REDIS_URL=');
    expect(envContent).toContain('SUPABASE_URL=');
    expect(envContent).toContain('SUPABASE_KEY=');
    expect(envContent).toContain('JWT_SECRET=');
    expect(envContent).toContain('NODE_ENV=development');
  });
  
  it('should have required variables in staging environment', () => {
    // Read .env.staging file
    const envPath = path.join(rootDir, '.env.staging');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for required variables
    expect(envContent).toContain('DATABASE_URL=');
    expect(envContent).toContain('REDIS_URL=');
    expect(envContent).toContain('SUPABASE_URL=');
    expect(envContent).toContain('SUPABASE_KEY=');
    expect(envContent).toContain('JWT_SECRET=');
    expect(envContent).toContain('NODE_ENV=production');
  });
  
  it('should have required variables in production environment', () => {
    // Read .env.production file
    const envPath = path.join(rootDir, '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for required variables
    expect(envContent).toContain('DATABASE_URL=');
    expect(envContent).toContain('REDIS_URL=');
    expect(envContent).toContain('SUPABASE_URL=');
    expect(envContent).toContain('SUPABASE_KEY=');
    expect(envContent).toContain('JWT_SECRET=');
    expect(envContent).toContain('NODE_ENV=production');
  });
  
  it('should have different API URLs for each environment', () => {
    // Read environment files
    const devEnvPath = path.join(rootDir, '.env.development');
    const stagingEnvPath = path.join(rootDir, '.env.staging');
    const prodEnvPath = path.join(rootDir, '.env.production');
    
    const devEnvContent = fs.readFileSync(devEnvPath, 'utf8');
    const stagingEnvContent = fs.readFileSync(stagingEnvPath, 'utf8');
    const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
    
    // Check API URLs
    expect(devEnvContent).toContain('NEXT_PUBLIC_API_URL=http://localhost:3000/api');
    expect(stagingEnvContent).toContain('NEXT_PUBLIC_API_URL=https://staging-api.careerireland.com/api');
    expect(prodEnvContent).toContain('NEXT_PUBLIC_API_URL=https://api.careerireland.com/api');
  });
  
  it('should have different log levels for each environment', () => {
    // Read environment files
    const devEnvPath = path.join(rootDir, '.env.development');
    const stagingEnvPath = path.join(rootDir, '.env.staging');
    const prodEnvPath = path.join(rootDir, '.env.production');
    
    const devEnvContent = fs.readFileSync(devEnvPath, 'utf8');
    const stagingEnvContent = fs.readFileSync(stagingEnvPath, 'utf8');
    const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
    
    // Check log levels
    expect(devEnvContent).toContain('LOG_LEVEL=debug');
    expect(stagingEnvContent).toContain('LOG_LEVEL=info');
    expect(prodEnvContent).toContain('LOG_LEVEL=warn');
  });
});
