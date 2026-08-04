import { Page, test } from '@playwright/test';

const LOCATORS = {
  assuranceRecommandeeOption: "//span[contains(text(),'Assurance recommandée')]",
  assuranceEssentielleOption: "//span[contains(text(),'Assurance essentielle')]",
  noAssuranceOption: "//span[contains(text(),'Je ne souhaite pas')]",
  agreeNoCoverage: "//*[@for='agree-no-coverage']",
  submitButton: "//button[@type='submit']"
};

export async function setAssurance(page: Page, assurance: string) {
  await test.step("Etape: Assurance", async () => {
    if(process.env.assurance == "non"){
      await page.click(LOCATORS.noAssuranceOption);
      await page.click(LOCATORS.agreeNoCoverage);
    }
    else{
      await page.locator(LOCATORS.assuranceRecommandeeOption).or(page.locator(LOCATORS.assuranceEssentielleOption)).nth(0).click();
    }
    await page.click(LOCATORS.submitButton);
});
}