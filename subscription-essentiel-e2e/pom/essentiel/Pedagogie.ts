import { test, Page } from '@playwright/test';

const LOCATORS = {
  storyButton: "//button[@id='story-x']",
  continueButton: "//button[@class='btn btn-stretch']"
};

export async function nextPedagogieId(page: Page) {
  await test.step('Etape: Pédagogie', async () => {
    await page.waitForTimeout(3000);
    await page.waitForLoadState("load")
    await page.click(LOCATORS.storyButton);
    await page.click(LOCATORS.continueButton);
  });
}