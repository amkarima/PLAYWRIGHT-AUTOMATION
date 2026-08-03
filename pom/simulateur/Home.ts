import { Page, test } from '@playwright/test';

const LOCATORS = {
  acceptCookiesButton: '//span[contains(text(),"Accepter")]'
};

export async function acceptPopupCookies(page: Page): Promise<void> {
  await test.step("Popup: Cookies", async () => {
    await page.click(LOCATORS.acceptCookiesButton, {timeout: 20000});
  });  
}