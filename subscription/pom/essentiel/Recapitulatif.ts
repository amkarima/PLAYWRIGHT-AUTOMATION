import { test, Page } from '@playwright/test';
import path from 'path'
const LOCATORS = {
  submitButton: "//button[@type='submit']",
  checkboxFrame: "//div[@class='checkbox-frame']"
};

export async function acceptRecapitulatifInfos(page: Page) {
  await test.step("Etape: Recapitulatif informations", async () => {
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load')
    await page.getByText("Votre récapitulatif").click()
    await page.locator("button").filter({hasText:"Confirmer"}).click()
  });  
}

export async function acceptRecapitulatifFinancement(page: Page) {
  await test.step("Etape: Recapitulatif financement", async () => {
    await page.waitForLoadState('load')
    await page.getByText("Je reconnais avoir").click()

    await page.waitForTimeout(1000);
    await page.locator("button").filter({hasText:"Valider"}).click()
  });  
}