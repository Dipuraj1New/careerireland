/**
 * Selenium WebDriver service for government portal automation
 */
import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import edge from 'selenium-webdriver/edge';
import config from '../../lib/config';
import { PortalCredentials } from '../../types/portal';

/**
 * Initialize WebDriver based on configuration
 */
export async function initializeWebDriver(): Promise<WebDriver> {
  let builder = new Builder();
  
  // Configure browser options
  switch (config.selenium.driverType) {
    case 'chrome': {
      const options = new chrome.Options();
      if (config.selenium.headless) {
        options.headless();
      }
      builder = builder.forBrowser('chrome').setChromeOptions(options);
      break;
    }
    case 'firefox': {
      const options = new firefox.Options();
      if (config.selenium.headless) {
        options.headless();
      }
      builder = builder.forBrowser('firefox').setFirefoxOptions(options);
      break;
    }
    case 'edge': {
      const options = new edge.Options();
      if (config.selenium.headless) {
        options.headless();
      }
      builder = builder.forBrowser('edge').setEdgeOptions(options);
      break;
    }
    default:
      throw new Error(`Unsupported browser type: ${config.selenium.driverType}`);
  }
  
  // Set timeout
  builder = builder.setPageLoadTimeout(config.selenium.timeout);
  
  return builder.build();
}

/**
 * Navigate to a URL
 */
export async function navigateTo(driver: WebDriver, url: string): Promise<void> {
  await driver.get(url);
}

/**
 * Find element by ID
 */
export async function findElementById(driver: WebDriver, id: string, timeout = config.selenium.timeout): Promise<WebElement> {
  return driver.wait(until.elementLocated(By.id(id)), timeout);
}

/**
 * Find element by name
 */
export async function findElementByName(driver: WebDriver, name: string, timeout = config.selenium.timeout): Promise<WebElement> {
  return driver.wait(until.elementLocated(By.name(name)), timeout);
}

/**
 * Find element by CSS selector
 */
export async function findElementBySelector(driver: WebDriver, selector: string, timeout = config.selenium.timeout): Promise<WebElement> {
  return driver.wait(until.elementLocated(By.css(selector)), timeout);
}

/**
 * Find element by XPath
 */
export async function findElementByXPath(driver: WebDriver, xpath: string, timeout = config.selenium.timeout): Promise<WebElement> {
  return driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
}

/**
 * Fill input field
 */
export async function fillInput(element: WebElement, value: string): Promise<void> {
  await element.clear();
  await element.sendKeys(value);
}

/**
 * Click element
 */
export async function clickElement(element: WebElement): Promise<void> {
  await element.click();
}

/**
 * Select option from dropdown by value
 */
export async function selectOptionByValue(element: WebElement, value: string): Promise<void> {
  await element.findElement(By.css(`option[value="${value}"]`)).click();
}

/**
 * Select option from dropdown by text
 */
export async function selectOptionByText(element: WebElement, text: string): Promise<void> {
  await element.findElement(By.xpath(`//option[text()="${text}"]`)).click();
}

/**
 * Wait for element to be visible
 */
export async function waitForElementVisible(driver: WebDriver, locator: By, timeout = config.selenium.timeout): Promise<WebElement> {
  return driver.wait(until.elementIsVisible(driver.findElement(locator)), timeout);
}

/**
 * Wait for element to be clickable
 */
export async function waitForElementClickable(driver: WebDriver, locator: By, timeout = config.selenium.timeout): Promise<WebElement> {
  return driver.wait(until.elementIsEnabled(driver.findElement(locator)), timeout);
}

/**
 * Wait for page title to contain text
 */
export async function waitForTitleContains(driver: WebDriver, text: string, timeout = config.selenium.timeout): Promise<boolean> {
  return driver.wait(until.titleContains(text), timeout);
}

/**
 * Wait for URL to contain text
 */
export async function waitForUrlContains(driver: WebDriver, text: string, timeout = config.selenium.timeout): Promise<boolean> {
  return driver.wait(until.urlContains(text), timeout);
}

/**
 * Take screenshot
 */
export async function takeScreenshot(driver: WebDriver): Promise<string> {
  return driver.takeScreenshot();
}

/**
 * Close WebDriver
 */
export async function closeDriver(driver: WebDriver): Promise<void> {
  await driver.quit();
}

/**
 * Get portal credentials from secure storage
 * In a production environment, this would retrieve credentials from a secure vault like AWS Secrets Manager
 */
export async function getPortalCredentials(portalType: string): Promise<PortalCredentials> {
  // In a real implementation, this would retrieve credentials from a secure vault
  // For development purposes, we're using environment variables
  
  // This is a placeholder implementation
  // In production, use a secure vault like AWS Secrets Manager
  return {
    username: process.env[`${portalType}_USERNAME`] || '',
    password: process.env[`${portalType}_PASSWORD`] || '',
  };
}
