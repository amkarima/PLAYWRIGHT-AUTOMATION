import { Page, test } from '@playwright/test';

const LOCATORS = {
  cardOption: "//span[contains(text(),'Je souhaite recevoir la carte')]",
  noCardOption: "//span[contains(text(),'Je ne souhaite pas')]",
  CeasyCardOption: "//span[contains(text(),'Carte gratuite')]",
  submitButton: "//button[@type='submit']"
};

export async function setCard(page: Page, carte: boolean) {
  await test.step("Etape: Carte ..", async () => {
    if(!carte){
      await page.click(LOCATORS.noCardOption);
    }
    else{
      await page.locator(LOCATORS.cardOption).nth(0).click();
    }
    await page.click(LOCATORS.submitButton);
});
}

export async function setCardCeasy(page: Page,partner: string, carte: boolean) {
  await test.step("Etape: Carte ..", async () => {
    if(!carte){
      await page.click(LOCATORS.noCardOption);
    }
    else{
      await page.locator(LOCATORS.CeasyCardOption).nth(0).click();
    }
    await page.click(LOCATORS.submitButton);
});
}