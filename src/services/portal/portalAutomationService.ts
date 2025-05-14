/**
 * Portal automation service for government portal integration
 */
import { WebDriver } from 'selenium-webdriver';
import * as seleniumService from './seleniumService';
import * as portalRepository from '../../repositories/portalRepository';
import * as formSubmissionRepository from '../../repositories/formSubmissionRepository';
import * as retryService from './retryService';
import { createAuditLog } from '../auditLogService';
import { AuditAction, AuditEntityType } from '../../types/audit';
import {
  GovernmentPortalType,
  PortalSubmission,
  PortalSubmissionResult,
  PortalSubmissionStatus,
} from '../../types/portal';
import config from '../../lib/config';
import { FormSubmission } from '../../types/form';

/**
 * Submit form to government portal
 */
export async function submitFormToPortal(
  portalSubmissionId: string,
  userId: string
): Promise<PortalSubmissionResult> {
  let driver: WebDriver | null = null;

  try {
    // Get portal submission
    const portalSubmission = await portalRepository.getPortalSubmissionById(portalSubmissionId);
    if (!portalSubmission) {
      return {
        success: false,
        status: PortalSubmissionStatus.FAILED,
        errorMessage: 'Portal submission not found',
      };
    }

    // Get form submission
    const formSubmission = await formSubmissionRepository.getFormSubmissionById(portalSubmission.formSubmissionId);
    if (!formSubmission) {
      return {
        success: false,
        status: PortalSubmissionStatus.FAILED,
        errorMessage: 'Form submission not found',
      };
    }

    // Update submission status to in progress
    await portalRepository.updatePortalSubmission(portalSubmissionId, {
      status: PortalSubmissionStatus.IN_PROGRESS,
      lastAttemptAt: new Date(),
      retryCount: portalSubmission.retryCount + 1,
    });

    // Initialize WebDriver
    driver = await seleniumService.initializeWebDriver();

    // Submit form based on portal type
    let result: PortalSubmissionResult;

    switch (portalSubmission.portalType) {
      case GovernmentPortalType.IRISH_IMMIGRATION:
        result = await submitToIrishImmigrationPortal(driver, formSubmission, portalSubmission);
        break;
      case GovernmentPortalType.IRISH_VISA:
        result = await submitToIrishVisaPortal(driver, formSubmission, portalSubmission);
        break;
      case GovernmentPortalType.GNIB:
        result = await submitToGNIBPortal(driver, formSubmission, portalSubmission);
        break;
      case GovernmentPortalType.EMPLOYMENT_PERMIT:
        result = await submitToEmploymentPermitPortal(driver, formSubmission, portalSubmission);
        break;
      default:
        result = {
          success: false,
          status: PortalSubmissionStatus.FAILED,
          errorMessage: `Unsupported portal type: ${portalSubmission.portalType}`,
        };
    }

    // Update submission status
    await portalRepository.updatePortalSubmission(portalSubmissionId, {
      status: result.status,
      confirmationNumber: result.confirmationNumber,
      confirmationReceiptUrl: result.confirmationReceiptUrl,
      errorMessage: result.errorMessage,
      lastAttemptAt: new Date(),
    });

    // Create audit log
    await createAuditLog({
      userId,
      entityType: AuditEntityType.PORTAL_SUBMISSION,
      entityId: portalSubmissionId,
      action: result.success ? AuditAction.SUBMIT_SUCCESS : AuditAction.SUBMIT_FAILURE,
      details: {
        formSubmissionId: portalSubmission.formSubmissionId,
        portalType: portalSubmission.portalType,
        status: result.status,
        confirmationNumber: result.confirmationNumber,
        errorMessage: result.errorMessage,
      },
    });

    // Handle failed submission for potential retry
    if (!result.success) {
      await retryService.handleFailedSubmission(portalSubmissionId, userId, result);
    }

    return result;
  } catch (error) {
    console.error('Error submitting form to portal:', error);

    // Create result object
    const result = {
      success: false,
      status: PortalSubmissionStatus.FAILED,
      errorMessage: `Unexpected error: ${error.message}`,
    };

    // Update submission status to failed
    if (portalSubmissionId) {
      await portalRepository.updatePortalSubmission(portalSubmissionId, {
        status: PortalSubmissionStatus.FAILED,
        errorMessage: result.errorMessage,
        lastAttemptAt: new Date(),
      });

      // Create audit log
      await createAuditLog({
        userId,
        entityType: AuditEntityType.PORTAL_SUBMISSION,
        entityId: portalSubmissionId,
        action: AuditAction.SUBMIT_FAILURE,
        details: {
          errorMessage: error.message,
        },
      });

      // Handle failed submission for potential retry
      await retryService.handleFailedSubmission(portalSubmissionId, userId, result);
    }

    return result;
  } finally {
    // Close WebDriver
    if (driver) {
      await seleniumService.closeDriver(driver);
    }
  }
}

/**
 * Submit form to Irish Immigration Portal
 * This is a placeholder implementation that would be replaced with actual portal automation
 */
async function submitToIrishImmigrationPortal(
  driver: WebDriver,
  formSubmission: FormSubmission,
  portalSubmission: PortalSubmission
): Promise<PortalSubmissionResult> {
  try {
    // Get field mappings
    const fieldMappings = await portalRepository.getFieldMappingsByPortalType(
      GovernmentPortalType.IRISH_IMMIGRATION
    );

    // Get portal credentials
    const credentials = await seleniumService.getPortalCredentials('IRISH_IMMIGRATION');

    // Navigate to portal
    await seleniumService.navigateTo(driver, 'https://www.irishimmigration.ie/');

    // Login to portal
    const loginButton = await seleniumService.findElementBySelector(driver, '.login-button');
    await seleniumService.clickElement(loginButton);

    const usernameField = await seleniumService.findElementById(driver, 'username');
    const passwordField = await seleniumService.findElementById(driver, 'password');
    const submitButton = await seleniumService.findElementBySelector(driver, 'button[type="submit"]');

    await seleniumService.fillInput(usernameField, credentials.username);
    await seleniumService.fillInput(passwordField, credentials.password);
    await seleniumService.clickElement(submitButton);

    // Navigate to form submission page
    const newApplicationButton = await seleniumService.findElementBySelector(driver, '.new-application-button');
    await seleniumService.clickElement(newApplicationButton);

    // Fill form fields using field mappings
    for (const mapping of fieldMappings) {
      const fieldValue = formSubmission.formData[mapping.formField];
      if (fieldValue) {
        try {
          const field = await seleniumService.findElementByName(driver, mapping.portalField);
          await seleniumService.fillInput(field, fieldValue);
        } catch (error) {
          console.warn(`Field not found: ${mapping.portalField}`);
        }
      }
    }

    // Submit form
    const submitFormButton = await seleniumService.findElementById(driver, 'submit-application');
    await seleniumService.clickElement(submitFormButton);

    // Wait for confirmation page
    await seleniumService.waitForUrlContains(driver, 'confirmation');

    // Get confirmation number
    const confirmationElement = await seleniumService.findElementBySelector(driver, '.confirmation-number');
    const confirmationNumber = await confirmationElement.getText();

    // Take screenshot of confirmation page
    const screenshot = await seleniumService.takeScreenshot(driver);

    // In a real implementation, we would save the screenshot to storage
    // and return the URL to the stored screenshot
    const confirmationReceiptUrl = `https://storage.example.com/confirmations/${confirmationNumber}.png`;

    return {
      success: true,
      status: PortalSubmissionStatus.COMPLETED,
      confirmationNumber,
      confirmationReceiptUrl,
    };
  } catch (error) {
    console.error('Error submitting to Irish Immigration Portal:', error);

    // Take screenshot of error page
    let errorScreenshot;
    try {
      errorScreenshot = await seleniumService.takeScreenshot(driver);
    } catch (screenshotError) {
      console.error('Error taking screenshot:', screenshotError);
    }

    return {
      success: false,
      status: PortalSubmissionStatus.FAILED,
      errorMessage: `Portal submission failed: ${error.message}`,
    };
  }
}

/**
 * Submit form to Irish Visa Portal
 */
async function submitToIrishVisaPortal(
  driver: WebDriver,
  formSubmission: FormSubmission,
  portalSubmission: PortalSubmission
): Promise<PortalSubmissionResult> {
  try {
    // Get field mappings
    const fieldMappings = await portalRepository.getFieldMappingsByPortalType(
      GovernmentPortalType.IRISH_VISA
    );

    // Get portal credentials
    const credentials = await seleniumService.getPortalCredentials('IRISH_VISA');

    // Navigate to portal
    await seleniumService.navigateTo(driver, 'https://www.irishvisa.gov.ie/');

    // Login to portal
    const loginButton = await seleniumService.findElementBySelector(driver, '.login-btn');
    await seleniumService.clickElement(loginButton);

    const usernameField = await seleniumService.findElementById(driver, 'email');
    const passwordField = await seleniumService.findElementById(driver, 'password');
    const submitButton = await seleniumService.findElementBySelector(driver, 'button[type="submit"]');

    await seleniumService.fillInput(usernameField, credentials.username);
    await seleniumService.fillInput(passwordField, credentials.password);
    await seleniumService.clickElement(submitButton);

    // Navigate to application form
    const newApplicationButton = await seleniumService.findElementBySelector(driver, '.new-application');
    await seleniumService.clickElement(newApplicationButton);

    // Select visa type
    const visaTypeDropdown = await seleniumService.findElementById(driver, 'visa-type');
    await seleniumService.selectOptionByValue(visaTypeDropdown, formSubmission.formData.visaType || 'GENERAL');

    // Fill form fields using field mappings
    for (const mapping of fieldMappings) {
      const fieldValue = formSubmission.formData[mapping.formField];
      if (fieldValue) {
        try {
          const field = await seleniumService.findElementByName(driver, mapping.portalField);
          await seleniumService.fillInput(field, fieldValue);
        } catch (error) {
          console.warn(`Field not found: ${mapping.portalField}`);
        }
      }
    }

    // Handle special fields that might require different interactions
    // For example, date pickers, checkboxes, radio buttons, etc.
    if (formSubmission.formData.dateOfBirth) {
      try {
        const dateField = await seleniumService.findElementById(driver, 'date-of-birth');
        await seleniumService.fillInput(dateField, formSubmission.formData.dateOfBirth);
      } catch (error) {
        console.warn('Date of birth field not found or could not be filled');
      }
    }

    // Upload documents if needed
    if (formSubmission.formData.documents && Array.isArray(formSubmission.formData.documents)) {
      for (const doc of formSubmission.formData.documents) {
        try {
          const uploadField = await seleniumService.findElementById(driver, doc.type);
          await uploadField.sendKeys(doc.path);
        } catch (error) {
          console.warn(`Document upload field not found: ${doc.type}`);
        }
      }
    }

    // Submit form
    const submitFormButton = await seleniumService.findElementById(driver, 'submit-application');
    await seleniumService.clickElement(submitFormButton);

    // Wait for confirmation page
    await seleniumService.waitForUrlContains(driver, 'confirmation');

    // Get confirmation number
    const confirmationElement = await seleniumService.findElementBySelector(driver, '.confirmation-number');
    const confirmationNumber = await confirmationElement.getText();

    // Take screenshot of confirmation page
    const screenshot = await seleniumService.takeScreenshot(driver);

    // In a real implementation, we would save the screenshot to storage
    // and return the URL to the stored screenshot
    const confirmationReceiptUrl = `https://storage.example.com/confirmations/${confirmationNumber}.png`;

    return {
      success: true,
      status: PortalSubmissionStatus.COMPLETED,
      confirmationNumber,
      confirmationReceiptUrl,
    };
  } catch (error) {
    console.error('Error submitting to Irish Visa Portal:', error);

    // Take screenshot of error page
    let errorScreenshot;
    try {
      errorScreenshot = await seleniumService.takeScreenshot(driver);
    } catch (screenshotError) {
      console.error('Error taking screenshot:', screenshotError);
    }

    return {
      success: false,
      status: PortalSubmissionStatus.FAILED,
      errorMessage: `Portal submission failed: ${error.message}`,
    };
  }
}

/**
 * Submit form to GNIB Portal (Garda National Immigration Bureau)
 */
async function submitToGNIBPortal(
  driver: WebDriver,
  formSubmission: FormSubmission,
  portalSubmission: PortalSubmission
): Promise<PortalSubmissionResult> {
  try {
    // Get field mappings
    const fieldMappings = await portalRepository.getFieldMappingsByPortalType(
      GovernmentPortalType.GNIB
    );

    // Get portal credentials
    const credentials = await seleniumService.getPortalCredentials('GNIB');

    // Navigate to portal
    await seleniumService.navigateTo(driver, 'https://burghquayregistrationoffice.inis.gov.ie/');

    // Click on "Make an appointment" button
    const appointmentButton = await seleniumService.findElementBySelector(driver, '.appointment-button');
    await seleniumService.clickElement(appointmentButton);

    // Fill form fields using field mappings
    for (const mapping of fieldMappings) {
      const fieldValue = formSubmission.formData[mapping.formField];
      if (fieldValue) {
        try {
          const field = await seleniumService.findElementByName(driver, mapping.portalField);
          await seleniumService.fillInput(field, fieldValue);
        } catch (error) {
          console.warn(`Field not found: ${mapping.portalField}`);
        }
      }
    }

    // Handle special fields for GNIB application

    // Select category
    if (formSubmission.formData.category) {
      try {
        const categoryDropdown = await seleniumService.findElementById(driver, 'Category');
        await seleniumService.selectOptionByText(categoryDropdown, formSubmission.formData.category);
      } catch (error) {
        console.warn('Category dropdown not found or could not be filled');
      }
    }

    // Select subcategory
    if (formSubmission.formData.subcategory) {
      try {
        const subcategoryDropdown = await seleniumService.findElementById(driver, 'SubCategory');
        await seleniumService.selectOptionByText(subcategoryDropdown, formSubmission.formData.subcategory);
      } catch (error) {
        console.warn('Subcategory dropdown not found or could not be filled');
      }
    }

    // Accept terms and conditions
    try {
      const termsCheckbox = await seleniumService.findElementById(driver, 'termsCheckbox');
      await seleniumService.clickElement(termsCheckbox);
    } catch (error) {
      console.warn('Terms checkbox not found or could not be clicked');
    }

    // Look for available appointments
    const lookupButton = await seleniumService.findElementById(driver, 'btnLookup');
    await seleniumService.clickElement(lookupButton);

    // Wait for available slots to load
    await driver.sleep(2000); // Wait for AJAX to complete

    // Select first available appointment slot if any
    try {
      const appointmentSlot = await seleniumService.findElementBySelector(driver, '.appointment-slot:not(.disabled)');
      await seleniumService.clickElement(appointmentSlot);
    } catch (error) {
      return {
        success: false,
        status: PortalSubmissionStatus.FAILED,
        errorMessage: 'No available appointment slots found',
      };
    }

    // Confirm appointment
    const confirmButton = await seleniumService.findElementById(driver, 'btnConfirm');
    await seleniumService.clickElement(confirmButton);

    // Wait for confirmation page
    await seleniumService.waitForUrlContains(driver, 'confirmed');

    // Get confirmation number
    const confirmationElement = await seleniumService.findElementBySelector(driver, '.confirmation-number');
    const confirmationNumber = await confirmationElement.getText();

    // Take screenshot of confirmation page
    const screenshot = await seleniumService.takeScreenshot(driver);

    // In a real implementation, we would save the screenshot to storage
    // and return the URL to the stored screenshot
    const confirmationReceiptUrl = `https://storage.example.com/confirmations/${confirmationNumber}.png`;

    return {
      success: true,
      status: PortalSubmissionStatus.COMPLETED,
      confirmationNumber,
      confirmationReceiptUrl,
    };
  } catch (error) {
    console.error('Error submitting to GNIB Portal:', error);

    // Take screenshot of error page
    let errorScreenshot;
    try {
      errorScreenshot = await seleniumService.takeScreenshot(driver);
    } catch (screenshotError) {
      console.error('Error taking screenshot:', screenshotError);
    }

    return {
      success: false,
      status: PortalSubmissionStatus.FAILED,
      errorMessage: `Portal submission failed: ${error.message}`,
    };
  }
}

/**
 * Submit form to Employment Permit Portal
 */
async function submitToEmploymentPermitPortal(
  driver: WebDriver,
  formSubmission: FormSubmission,
  portalSubmission: PortalSubmission
): Promise<PortalSubmissionResult> {
  try {
    // Get field mappings
    const fieldMappings = await portalRepository.getFieldMappingsByPortalType(
      GovernmentPortalType.EMPLOYMENT_PERMIT
    );

    // Get portal credentials
    const credentials = await seleniumService.getPortalCredentials('EMPLOYMENT_PERMIT');

    // Navigate to portal
    await seleniumService.navigateTo(driver, 'https://epos.djei.ie/');

    // Login to portal
    const usernameField = await seleniumService.findElementById(driver, 'username');
    const passwordField = await seleniumService.findElementById(driver, 'password');
    const loginButton = await seleniumService.findElementById(driver, 'login-button');

    await seleniumService.fillInput(usernameField, credentials.username);
    await seleniumService.fillInput(passwordField, credentials.password);
    await seleniumService.clickElement(loginButton);

    // Navigate to new application page
    const newApplicationLink = await seleniumService.findElementBySelector(driver, 'a[href*="new-application"]');
    await seleniumService.clickElement(newApplicationLink);

    // Select permit type
    if (formSubmission.formData.permitType) {
      try {
        const permitTypeDropdown = await seleniumService.findElementById(driver, 'permit-type');
        await seleniumService.selectOptionByText(permitTypeDropdown, formSubmission.formData.permitType);
      } catch (error) {
        console.warn('Permit type dropdown not found or could not be filled');
      }
    }

    // Fill form fields using field mappings
    for (const mapping of fieldMappings) {
      const fieldValue = formSubmission.formData[mapping.formField];
      if (fieldValue) {
        try {
          const field = await seleniumService.findElementByName(driver, mapping.portalField);
          await seleniumService.fillInput(field, fieldValue);
        } catch (error) {
          console.warn(`Field not found: ${mapping.portalField}`);
        }
      }
    }

    // Handle multi-page form
    // This is a simplified implementation - in reality, the form might have multiple pages
    // and require more complex navigation

    // Page 1: Employer Details
    await fillEmployerDetails(driver, formSubmission);
    const nextButton1 = await seleniumService.findElementById(driver, 'next-button');
    await seleniumService.clickElement(nextButton1);

    // Page 2: Employee Details
    await fillEmployeeDetails(driver, formSubmission);
    const nextButton2 = await seleniumService.findElementById(driver, 'next-button');
    await seleniumService.clickElement(nextButton2);

    // Page 3: Job Details
    await fillJobDetails(driver, formSubmission);
    const nextButton3 = await seleniumService.findElementById(driver, 'next-button');
    await seleniumService.clickElement(nextButton3);

    // Page 4: Review and Submit
    // Accept terms and conditions
    const termsCheckbox = await seleniumService.findElementById(driver, 'terms-checkbox');
    await seleniumService.clickElement(termsCheckbox);

    // Submit application
    const submitButton = await seleniumService.findElementById(driver, 'submit-button');
    await seleniumService.clickElement(submitButton);

    // Wait for confirmation page
    await seleniumService.waitForUrlContains(driver, 'confirmation');

    // Get confirmation number
    const confirmationElement = await seleniumService.findElementBySelector(driver, '.confirmation-number');
    const confirmationNumber = await confirmationElement.getText();

    // Take screenshot of confirmation page
    const screenshot = await seleniumService.takeScreenshot(driver);

    // In a real implementation, we would save the screenshot to storage
    // and return the URL to the stored screenshot
    const confirmationReceiptUrl = `https://storage.example.com/confirmations/${confirmationNumber}.png`;

    return {
      success: true,
      status: PortalSubmissionStatus.COMPLETED,
      confirmationNumber,
      confirmationReceiptUrl,
    };
  } catch (error) {
    console.error('Error submitting to Employment Permit Portal:', error);

    // Take screenshot of error page
    let errorScreenshot;
    try {
      errorScreenshot = await seleniumService.takeScreenshot(driver);
    } catch (screenshotError) {
      console.error('Error taking screenshot:', screenshotError);
    }

    return {
      success: false,
      status: PortalSubmissionStatus.FAILED,
      errorMessage: `Portal submission failed: ${error.message}`,
    };
  }
}

/**
 * Helper function to fill employer details on the Employment Permit Portal
 */
async function fillEmployerDetails(driver: WebDriver, formSubmission: FormSubmission): Promise<void> {
  // Fill employer name
  if (formSubmission.formData.employerName) {
    const employerNameField = await seleniumService.findElementById(driver, 'employer-name');
    await seleniumService.fillInput(employerNameField, formSubmission.formData.employerName);
  }

  // Fill employer registration number
  if (formSubmission.formData.employerRegistrationNumber) {
    const regNumberField = await seleniumService.findElementById(driver, 'employer-reg-number');
    await seleniumService.fillInput(regNumberField, formSubmission.formData.employerRegistrationNumber);
  }

  // Fill employer address
  if (formSubmission.formData.employerAddress) {
    const addressField = await seleniumService.findElementById(driver, 'employer-address');
    await seleniumService.fillInput(addressField, formSubmission.formData.employerAddress);
  }

  // Fill employer contact details
  if (formSubmission.formData.employerContactName) {
    const contactNameField = await seleniumService.findElementById(driver, 'employer-contact-name');
    await seleniumService.fillInput(contactNameField, formSubmission.formData.employerContactName);
  }

  if (formSubmission.formData.employerPhone) {
    const phoneField = await seleniumService.findElementById(driver, 'employer-phone');
    await seleniumService.fillInput(phoneField, formSubmission.formData.employerPhone);
  }

  if (formSubmission.formData.employerEmail) {
    const emailField = await seleniumService.findElementById(driver, 'employer-email');
    await seleniumService.fillInput(emailField, formSubmission.formData.employerEmail);
  }
}

/**
 * Helper function to fill employee details on the Employment Permit Portal
 */
async function fillEmployeeDetails(driver: WebDriver, formSubmission: FormSubmission): Promise<void> {
  // Fill employee name
  if (formSubmission.formData.firstName) {
    const firstNameField = await seleniumService.findElementById(driver, 'first-name');
    await seleniumService.fillInput(firstNameField, formSubmission.formData.firstName);
  }

  if (formSubmission.formData.lastName) {
    const lastNameField = await seleniumService.findElementById(driver, 'last-name');
    await seleniumService.fillInput(lastNameField, formSubmission.formData.lastName);
  }

  // Fill date of birth
  if (formSubmission.formData.dateOfBirth) {
    const dobField = await seleniumService.findElementById(driver, 'date-of-birth');
    await seleniumService.fillInput(dobField, formSubmission.formData.dateOfBirth);
  }

  // Fill nationality
  if (formSubmission.formData.nationality) {
    const nationalityDropdown = await seleniumService.findElementById(driver, 'nationality');
    await seleniumService.selectOptionByText(nationalityDropdown, formSubmission.formData.nationality);
  }

  // Fill passport details
  if (formSubmission.formData.passportNumber) {
    const passportField = await seleniumService.findElementById(driver, 'passport-number');
    await seleniumService.fillInput(passportField, formSubmission.formData.passportNumber);
  }

  if (formSubmission.formData.passportExpiry) {
    const passportExpiryField = await seleniumService.findElementById(driver, 'passport-expiry');
    await seleniumService.fillInput(passportExpiryField, formSubmission.formData.passportExpiry);
  }
}

/**
 * Helper function to fill job details on the Employment Permit Portal
 */
async function fillJobDetails(driver: WebDriver, formSubmission: FormSubmission): Promise<void> {
  // Fill job title
  if (formSubmission.formData.jobTitle) {
    const jobTitleField = await seleniumService.findElementById(driver, 'job-title');
    await seleniumService.fillInput(jobTitleField, formSubmission.formData.jobTitle);
  }

  // Fill job description
  if (formSubmission.formData.jobDescription) {
    const jobDescField = await seleniumService.findElementById(driver, 'job-description');
    await seleniumService.fillInput(jobDescField, formSubmission.formData.jobDescription);
  }

  // Fill salary details
  if (formSubmission.formData.annualSalary) {
    const salaryField = await seleniumService.findElementById(driver, 'annual-salary');
    await seleniumService.fillInput(salaryField, formSubmission.formData.annualSalary);
  }

  // Fill working hours
  if (formSubmission.formData.hoursPerWeek) {
    const hoursField = await seleniumService.findElementById(driver, 'hours-per-week');
    await seleniumService.fillInput(hoursField, formSubmission.formData.hoursPerWeek);
  }

  // Fill work location
  if (formSubmission.formData.workLocation) {
    const locationField = await seleniumService.findElementById(driver, 'work-location');
    await seleniumService.fillInput(locationField, formSubmission.formData.workLocation);
  }
}
