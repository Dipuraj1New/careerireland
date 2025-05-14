/**
 * Deployment configuration tests
 */
import fs from 'fs';
import path from 'path';

describe('Deployment Configuration', () => {
  const rootDir = process.cwd();
  
  it('should have GitHub Actions workflow for testing', () => {
    // Check if .github/workflows/test.yml file exists
    const workflowPath = path.join(rootDir, '.github/workflows/test.yml');
    const exists = fs.existsSync(workflowPath);
    
    // Assert
    expect(exists).toBe(true);
    
    // Check content
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('name: Test');
    expect(content).toContain('runs-on: ubuntu-latest');
    expect(content).toContain('postgres:');
    expect(content).toContain('redis:');
    expect(content).toContain('npm run test:coverage');
  });
  
  it('should have GitHub Actions workflow for staging deployment', () => {
    // Check if .github/workflows/deploy-staging.yml file exists
    const workflowPath = path.join(rootDir, '.github/workflows/deploy-staging.yml');
    const exists = fs.existsSync(workflowPath);
    
    // Assert
    expect(exists).toBe(true);
    
    // Check content
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('name: Deploy to Staging');
    expect(content).toContain('branches: [ staging ]');
    expect(content).toContain('aws-actions/configure-aws-credentials');
    expect(content).toContain('aws-actions/amazon-ecr-login');
    expect(content).toContain('aws-actions/amazon-ecs-deploy-task-definition');
  });
  
  it('should have GitHub Actions workflow for production deployment', () => {
    // Check if .github/workflows/deploy-production.yml file exists
    const workflowPath = path.join(rootDir, '.github/workflows/deploy-production.yml');
    const exists = fs.existsSync(workflowPath);
    
    // Assert
    expect(exists).toBe(true);
    
    // Check content
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('name: Deploy to Production');
    expect(content).toContain('branches: [ main ]');
    expect(content).toContain('aws-actions/configure-aws-credentials');
    expect(content).toContain('aws-actions/amazon-ecr-login');
    expect(content).toContain('aws-actions/amazon-ecs-deploy-task-definition');
  });
  
  it('should have AWS task definition for staging', () => {
    // Check if .aws/task-definition-staging.json file exists
    const taskDefPath = path.join(rootDir, '.aws/task-definition-staging.json');
    const exists = fs.existsSync(taskDefPath);
    
    // Assert
    expect(exists).toBe(true);
    
    // Check content
    const content = fs.readFileSync(taskDefPath, 'utf8');
    const taskDef = JSON.parse(content);
    expect(taskDef.family).toBe('careerireland-staging');
    expect(taskDef.containerDefinitions[0].name).toBe('careerireland-app');
    expect(taskDef.containerDefinitions[0].environment).toContainEqual({
      name: 'NODE_ENV',
      value: 'production'
    });
    expect(taskDef.containerDefinitions[0].environment).toContainEqual({
      name: 'NEXT_PUBLIC_API_URL',
      value: 'https://staging-api.careerireland.com/api'
    });
    expect(taskDef.containerDefinitions[0].healthCheck).toBeDefined();
  });
  
  it('should have AWS task definition for production', () => {
    // Check if .aws/task-definition-production.json file exists
    const taskDefPath = path.join(rootDir, '.aws/task-definition-production.json');
    const exists = fs.existsSync(taskDefPath);
    
    // Assert
    expect(exists).toBe(true);
    
    // Check content
    const content = fs.readFileSync(taskDefPath, 'utf8');
    const taskDef = JSON.parse(content);
    expect(taskDef.family).toBe('careerireland-production');
    expect(taskDef.containerDefinitions[0].name).toBe('careerireland-app');
    expect(taskDef.containerDefinitions[0].environment).toContainEqual({
      name: 'NODE_ENV',
      value: 'production'
    });
    expect(taskDef.containerDefinitions[0].environment).toContainEqual({
      name: 'NEXT_PUBLIC_API_URL',
      value: 'https://api.careerireland.com/api'
    });
    expect(taskDef.containerDefinitions[0].healthCheck).toBeDefined();
  });
  
  it('should have Docker configuration', () => {
    // Check if Dockerfile exists
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    const exists = fs.existsSync(dockerfilePath);
    
    // Assert
    expect(exists).toBe(true);
    
    // Check content
    const content = fs.readFileSync(dockerfilePath, 'utf8');
    expect(content).toContain('FROM node:18-alpine');
    expect(content).toContain('WORKDIR /app');
    expect(content).toContain('RUN npm run build');
    expect(content).toContain('ENV NODE_ENV production');
  });
  
  it('should have Docker Compose configuration', () => {
    // Check if docker-compose.yml exists
    const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
    const exists = fs.existsSync(dockerComposePath);
    
    // Assert
    expect(exists).toBe(true);
  });
});
