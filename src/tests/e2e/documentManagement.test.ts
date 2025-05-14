import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { createUser } from '@/services/user/userRepository';
import { createCase } from '@/services/case/caseRepository';
import { VisaType, CasePriority, CaseStatus } from '@/types/case';
import { UserRole } from '@/types/user';

test.describe('Document Management Workflow', () => {
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

    // Create test case
    const caseId = uuidv4();
    await createCase({
      id: caseId,
      applicantId: userId,
      visaType: VisaType.STUDENT,
      status: CaseStatus.DRAFT,
      priority: CasePriority.STANDARD,
    });

    testUser = { id: userId, email, password };
    testCaseId = caseId;
  });

  test('should upload, categorize, preview, and delete a document', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');

    // Navigate to documents page
    await page.goto(`/documents?caseId=${testCaseId}`);

    // Upload a document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test document content'),
    });

    // Select document type
    await page.selectOption('select#documentType', 'passport');

    // Click upload button
    await page.click('button:has-text("Upload Document")');

    // Wait for upload to complete
    await expect(page.locator('text=Upload Complete')).toBeVisible();

    // Switch to category view
    await page.click('button:has-text("Category View")');

    // Verify category view is displayed
    await expect(page.locator('text=Document Categories')).toBeVisible();

    // Click on Passport category
    await page.click('text=Passport');

    // Verify document is displayed in category
    await expect(page.locator('text=test-document.pdf')).toBeVisible();

    // Click on document to preview
    await page.click('text=test-document.pdf');

    // Verify preview modal is displayed
    await expect(page.locator('text=Document Preview')).toBeVisible();

    // Close preview
    await page.click('button[aria-label="Close preview"]');

    // Switch back to list view
    await page.click('button:has-text("List View")');

    // Open action menu
    await page.click('button[aria-label="Document actions"]');

    // Click delete option
    await page.click('text=Delete');

    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());

    // Verify document is deleted
    await expect(page.locator('text=No documents uploaded yet')).toBeVisible();
  });

  test('should filter documents by category', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Navigate to documents page
    await page.goto(`/documents?caseId=${testCaseId}`);

    // Upload passport document
    const fileInput1 = page.locator('input[type="file"]');
    await fileInput1.setInputFiles({
      name: 'passport.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Passport content'),
    });
    await page.selectOption('select#documentType', 'passport');
    await page.click('button:has-text("Upload Document")');
    await expect(page.locator('text=Upload Complete')).toBeVisible();

    // Upload financial document
    const fileInput2 = page.locator('input[type="file"]');
    await fileInput2.setInputFiles({
      name: 'bank-statement.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Bank statement content'),
    });
    await page.selectOption('select#documentType', 'financial');
    await page.click('button:has-text("Upload Document")');
    await expect(page.locator('text=Upload Complete')).toBeVisible();

    // Switch to category view
    await page.click('button:has-text("Category View")');

    // Click on Passport category
    await page.click('text=Passport');

    // Verify only passport document is displayed
    await expect(page.locator('text=passport.pdf')).toBeVisible();
    await expect(page.locator('text=bank-statement.pdf')).not.toBeVisible();

    // Click on Financial Document category
    await page.click('text=Financial Document');

    // Verify only financial document is displayed
    await expect(page.locator('text=bank-statement.pdf')).toBeVisible();
    await expect(page.locator('text=passport.pdf')).not.toBeVisible();

    // Click on All Documents
    await page.click('text=All Documents');

    // Verify both documents are displayed
    await expect(page.locator('text=passport.pdf')).toBeVisible();
    await expect(page.locator('text=bank-statement.pdf')).toBeVisible();
  });
});
