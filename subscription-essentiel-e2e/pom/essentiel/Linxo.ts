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
  ribInput: "//input[@id='input-iban']",
  retryMessage: "//*[contains(text(),'Echec de la connexion à votre banque')]"
};

const today = new Date();
const formattedDate = today.toISOString().split('T')[0].replace(/-/g, '_');

export async function connectLinxoAccount(page: Page, fichier: string) {
  await test.step("Etape: Connexion banque Linxo", async () => {
    await selectLinxoBank(page);

    const success = await retryLinxoConnection(page, fichier, 3);

    if (!success) {
      await setRib(page);
    }
  });
}

async function selectLinxoBank(page: Page) {
  await page.fill(LOCATORS.bankSearchInput, "Linxo");
  const linxoOption = page.getByText("Linxo Test Bank").filter({ visible: true }).first();

  await linxoOption.waitFor({ state: "visible", timeout: 30000 });
  await linxoOption.click();

  await page.click(LOCATORS.submitButton);
  await page.click(LOCATORS.mauthentifierButton);
}

async function waitForBankStatementsCheck(page: Page) {
  const response = await page.waitForResponse(response => response.url().includes('/bankStatementsCheck') && response.request().method() === 'POST', { timeout: 180000 });
  return await response.json();
}

async function retryLinxoConnection(page: Page, fichier: string, maxRetries: number = 3): Promise<boolean> {
  let success = false;

  await test.step("Etape: Tentative de connexion Linxo avec gestion des retries", async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Tentative Linxo ${attempt}/${maxRetries}`);

      if (attempt > 1) {
        await page.locator(LOCATORS.retryMessage).waitFor({ state: "visible", timeout: 30000 });
        await selectLinxoBank(page);
      }

      const bankStatementsCheckPromise = waitForBankStatementsCheck(page);

      await fillLinxoCredentials(page, fichier);

      const result = await bankStatementsCheckPromise;

      console.log(`Réponse bankStatementsCheck : ${JSON.stringify(result)}`);

      if (result.status !== "2") {
        console.log(`Connexion Linxo réussie à la tentative ${attempt}`);
        success = true;
        break;
      }

      console.warn(`Linxo KO à la tentative ${attempt}`);
    }
  });

  return success;
}

async function fillLinxoCredentials(page: Page, fichier: string) {
  await test.step("Etape: Saisie des identifiants Linxo", async () => {
    await page.fill(LOCATORS.loginInput, "dev");
    await page.fill(LOCATORS.passwordInput, "dev");
    await page.fill(LOCATORS.fileUrlInput, `https://linxo-test-bank.s3.amazonaws.com/B2B/QyHEv57N954fehyc22/${formattedDate}/${fichier}.txt`);
    await page.waitForTimeout(1000);
    await page.keyboard.press("Enter");
  });
}

export async function selectFirstAccount(page: Page) {
  await test.step("Etape: Sélection compte RIB", async () => {
    await page.click(LOCATORS.firstAccountLabel, { timeout: 180000 });
    await page.click(LOCATORS.submitButton);
  });
}

export async function setRib(page: Page) {
  await test.step("Etape: Saisie du rib", async () => {
    await page.fill(LOCATORS.ribInput, "FR76 3000 6000 0112 3456 7890 189");
    await page.click(LOCATORS.submitButton);
  });
}

export async function bypassBanqueNotExist(page: Page, data: any, amount: number) {
  return test.step('Point finances - bypass Linxo banque pas dans la liste ...', async () => {
    await page.getByText("Continuer").click();  
    await page.locator(LOCATORS.bankSearchInput).fill("BanqueTestInexistante");   
    await page.locator("[id='open-linxo-bypass-btn']").click();
    await page.locator("[id='linxo-bypass-btn']").click();
  });
}