import { test, Page } from '@playwright/test';

const LOCATORS = {
  checkboxFrame: "//div[@class='checkbox-frame']",
  submitButton: "//button[@type='submit']"
};

export async function acceptNoticeSE(page: Page) {
  await test.step("Etape: Notice SE", async () => {
    //await page.waitForLoadState('load');
    //await page.click(LOCATORS.checkboxFrame);
    //await page.click(LOCATORS.submitButton);
  });  
}