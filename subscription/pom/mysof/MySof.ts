
import { test, Page } from '@playwright/test';

const LOCATORS = {
  BURGER_MENU: "//*[@class = 'menu__mobile__burgerMenu']",
  FINANCER_UN_PROJET_BUTTON: "//*[contains(text(),'Financer un projet')]",
  JE_SIMULE_UN_PROJET_BUTTON: "//*[contains(text(),'Je simule mon projet')]"
};


export async function startFinancementFromMySof(page) {
  await page.waitForLoadState("load")
  await test.step("Etape: Financement depuis l'espace client", async () => {
    await page.waitForTimeout(5000);
    await page.click(LOCATORS.BURGER_MENU);
    await page.waitForTimeout(2000);
    await page.click(LOCATORS.FINANCER_UN_PROJET_BUTTON);
    await page.click(LOCATORS.JE_SIMULE_UN_PROJET_BUTTON);
  });  

}