import { Page, test } from '@playwright/test';

const LOCATORS = {
  emailInput: "//input[@id='input-email']",
  telephoneInput: "//input[@id='input-telephone']",
  birthDateInput: "//*[@id = 'birthDate']",
  submitButton: "//button[@type='submit']"
};


export async function setInfos(page: Page, mail: string, tel: string, dateNaissance: string) {
  await test.step("Etape: Coordonnées email & tel", async () => {
    await page.waitForLoadState("load")
    if (mail === "RANDOM") {
      const mailrandom = `random${Date.now()}@test-auto.fr`;
      await page.fill(LOCATORS.emailInput, mailrandom);
    }
    else {
      await page.fill(LOCATORS.emailInput, mail)
    }
    await page.fill(LOCATORS.telephoneInput, tel);
    await page.fill(LOCATORS.birthDateInput, dateNaissance);
    await page.click('body');
    await page.click(LOCATORS.submitButton);
  });
}

/*await test.step('Etape: Recevez nos offres et bons plans', async () => {
  await page.waitForTimeout(2000);
  await page.waitForLoadState("load")
  await page.click(LOCATORS.submitButton, { force: true });
});*/