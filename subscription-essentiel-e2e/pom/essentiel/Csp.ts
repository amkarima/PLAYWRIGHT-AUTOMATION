import { Page, test } from '@playwright/test';

const LOCATORS = {
  selectCsp: "//div[@id='select-csp']",
  cspOption: "//li[@id='select-csp-7']",
  employmentSinceWhenInput: "//input[@id='employment-since-when']",
  salaryInput: "//input[@id='salary']",
  submitButton: "//button[@type='submit']"
};

export async function setCsp(page: Page, salaire: string, depuis: string) {
  await test.step("Etape: CSP", async () => {
    await page.getByText("Votre profession et vos revenus").click()
    await page.waitForTimeout(3000)
    await page.click(LOCATORS.selectCsp);
    await page.click(LOCATORS.cspOption);
    await page.fill(LOCATORS.employmentSinceWhenInput, depuis);
    await page.fill(LOCATORS.salaryInput, salaire);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await page.click(LOCATORS.submitButton, { force: true });
  });
}