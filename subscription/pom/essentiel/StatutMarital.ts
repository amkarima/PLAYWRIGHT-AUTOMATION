import { test, Page } from '@playwright/test';

const LOCATORS = {
  maritalStatusDropdown: "//div[@id='marital-status']",
  maritalStatusOption: "//li[@id='marital-status-0']",
  submitButton: "//button[@type='submit']"
};

export async function setStatutMarital(page: Page) {
  await test.step("Etape: Statut marital", async () => {
    await page.click(LOCATORS.maritalStatusDropdown);
    await page.click(LOCATORS.maritalStatusOption);
    await page.click(LOCATORS.submitButton);
  });  
}