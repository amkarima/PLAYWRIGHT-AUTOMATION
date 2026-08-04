import { Page, test } from '@playwright/test';

const LOCATORS = {
  suivantButton: "//*[contains(text(),'Continuer')]",
  streetInput: "//input[@id='address-search']",
  zipcodeInput: "//input[@id='zipcode']",
  housingTypeDropdown: "//div[@id='housing-type']",
  housingTypeOption: "//li[contains(text(),'Logé par la famille')]",
  rentInput: "//input[@id='rent']",
  movingInDateInput: "//input[@id='moving-in-date']",
  submitButton: "//button[@type='submit']"
};

export async function setAdresse(page: Page, adresse: string, zipcode: string, rent: string, movingDate: string, mitrust: boolean) {
  await test.step("Etape: Adresse", async () => {
    await page.waitForTimeout(3000);
    await page.click(LOCATORS.suivantButton);
    if (!mitrust) {
      await page.fill(LOCATORS.streetInput, adresse);
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.fill(LOCATORS.zipcodeInput, zipcode);
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
    }
    await page.click(LOCATORS.housingTypeDropdown);
    await page.click(LOCATORS.housingTypeOption);
   // await page.fill(LOCATORS.rentInput, rent);
    await page.fill(LOCATORS.movingInDateInput, movingDate);
    await page.waitForTimeout(1000);
    await page.click(LOCATORS.submitButton, { force: true });

  });
}