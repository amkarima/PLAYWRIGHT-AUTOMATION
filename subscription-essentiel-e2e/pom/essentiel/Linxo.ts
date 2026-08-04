import { test, Page } from '@playwright/test';

const LOCATORS = {
  mauthentifierButton: "//*[@data-e2e='submit-button']",
  suivantButton: "//*[contains(text(),'Continuer')]",
  bankSearchInput: "//input[@id='bank-search-input']",
  linxoTestBankOption: "//*[contains(text(),'Linxo Test Bank')]",
  submitButton: "//button[@type='submit']",
  loginInput: "//input[@id='login']",
  passwordInput: "//input[@id='password']",
  fileUrlInput: "//input[@id='file_url']",
  firstAccountLabel: "//label[@for='account-0']/span[1]",
  ribInput: "//input[@id='input-iban']"
};

const today = new Date();
const formattedDate = today.toISOString().split('T')[0].replace(/-/g, '_');

export async function connectLinxoAccount(page: Page, fichier: string) {
  await test.step("Etape: Connexion banque Linxo", async () => {
    await page.fill(LOCATORS.bankSearchInput, "Linxo");
    await page.click(LOCATORS.linxoTestBankOption);
    await page.click(LOCATORS.submitButton);
    await page.click(LOCATORS.mauthentifierButton);

    await page.fill(LOCATORS.loginInput, "dev");
    await page.fill(LOCATORS.passwordInput, "dev");
    await page.fill(LOCATORS.fileUrlInput, `https://linxo-test-bank.s3.amazonaws.com/B2B/QyHEv57N954fehyc22/${formattedDate}/${fichier}.txt`);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
  });
}

export async function selectFirstAccount(page: Page) {
  await test.step("Etape: Sélection compte RIB", async () => {
    await page.click(LOCATORS.firstAccountLabel, {timeout: 180000});
    await page.click(LOCATORS.submitButton);
  });
}

export async function setRib(page: Page) {
  await test.step("Etape: Saisie du rib", async () => {
    await page.fill(LOCATORS.ribInput, "FR76 3000 6000 0112 3456 7890 189");
    await page.click(LOCATORS.submitButton);
  });
}

//input-iban