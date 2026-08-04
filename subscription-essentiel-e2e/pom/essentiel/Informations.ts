import { Page } from '@playwright/test';

const LOCATORS = {
  submitButton: "//button[@type='submit']"
};

export async function validateInfos(page: Page) {
  await page.click(LOCATORS.submitButton);
}