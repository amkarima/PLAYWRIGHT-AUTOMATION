import { test, Page } from '@playwright/test';

const LOCATORS = {
  continueButton: "//*[contains(text(),'Continuer')]",
  submitButton: "//button[@type='submit']",
  connectButton: "//span[contains(text(),'Continuer')]",
  jsonOption: "//span[contains(text(),'JSON')]",
  consentSubmitButton: "//*[@id = 'consent_submit_button']",
  jsonInput: "//input[@aria-label = 'json']",
  credentialsSubmitButton: "//*[@id = 'credentials_submit_button']",
  authorizeButton: "//*[@id = 'authorize-btn']"
};

export async function skipPedagogieMiTrust(page: Page) {
  await test.step("Etape: Pedagogie Mi-trust", async () => {
    await page.getByText("Continuer").click();
    await page.waitForTimeout(2000)
    await page.getByText("Continuer").click();
    //await page.click(LOCATORS.submitButton);
  });  
}

export async function miTrust_se_connecter(page: Page, jsonMitrust: string) {
  await test.step("Etape: Connexion Mi-trust", async () => {
    await page.getByText("Se connecter").click()
    await page.locator(LOCATORS.jsonOption).nth(1).click();
    await page.click(LOCATORS.consentSubmitButton);
    await page.locator(LOCATORS.jsonInput).setInputFiles("datas/"+jsonMitrust);
    await page.click(LOCATORS.credentialsSubmitButton);
    await page.click(LOCATORS.authorizeButton);
  });  
} 