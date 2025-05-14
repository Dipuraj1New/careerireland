import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '@/services/user/userRepository';
import { createCase } from '@/services/case/caseRepository';
import { VisaType, CasePriority, CaseStatus } from '@/types/case';
import { UserRole } from '@/types/user';

test.describe('Case Management Workflow', () => {
  let testUser: { id: string; email: string; password: string };
  let testCaseId: string;

  test.beforeAll(async () => {
    // Create test user
    const userId = uuidv4();
    const email = `test-${userId}@example.com`;
    const password = 'Password123!';

    await createUser({
      id: userId,
      email,
      password,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.APPLICANT,
    });

    testUser = { id: userId, email, password };
  });

  test('should create a new case and view case details', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');

    // Navigate to new case page
    await page.goto('/cases/new');

    // Fill case details
    await page.selectOption('select#visaType', VisaType.STUDENT);
    await page.selectOption('select#priority', CasePriority.STANDARD);
    await page.fill('textarea#notes', 'Test case for e2e testing');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to case detail page
    await page.waitForURL(/\/cases\/[a-f0-9-]+/);

    // Extract case ID from URL
    const url = page.url();
    testCaseId = url.split('/').pop() || '';

    // Verify case details are displayed
    await expect(page.locator('text=Case Details')).toBeVisible();
    await expect(page.locator('text=Student Visa')).toBeVisible();
    await expect(page.locator('text=Draft')).toBeVisible();
    await expect(page.locator('text=Test case for e2e testing')).toBeVisible();
  });

  test('should display document checklist for the case', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Navigate to case detail page
    await page.goto(`/cases/${testCaseId}`);

    // Verify document checklist is displayed
    await expect(page.locator('text=Required Documents')).toBeVisible();
    await expect(page.locator('text=Passport')).toBeVisible();
    await expect(page.locator('text=Identification')).toBeVisible();
    await expect(page.locator('text=Financial Document')).toBeVisible();
    await expect(page.locator('text=Educational Document')).toBeVisible();
  });

  test('should submit the case and update status', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Navigate to case detail page
    await page.goto(`/cases/${testCaseId}`);

    // Click submit button
    await page.click('button:has-text("Submit Application")');

    // Verify status is updated
    await expect(page.locator('text=Submitted')).toBeVisible();

    // Verify timeline is updated
    await expect(page.locator('text=Status changed from Draft to Submitted')).toBeVisible();
  });

  test('should display case on dashboard', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');

    // Verify case is displayed in active applications
    await expect(page.locator('text=Active Application')).toBeVisible();
    await expect(page.locator('text=Student Visa')).toBeVisible();
    await expect(page.locator('text=Submitted')).toBeVisible();

    // Verify case is displayed in all applications table
    await expect(page.locator(`text=${testCaseId.substring(0, 8)}`)).toBeVisible();
  });
});
