import { expect, Page, test } from '@playwright/test';

const LOCATORS = {
  //selectCsp: "//div[@id='select-csp's]",
  selectCsp: "//*[@id='profession']",
  cspOption: "//li[@id='profession-7']",
  employmentSinceWhenInput: "//input[@id='employment-since-when']",
  salaryInput: "//div[@id='revenue']",
  salaryOption: "//*[@id='revenue-9']",
  situationInput: "//div[@id='marital-status-code']",
  situationOption: "//li[@id='marital-status-code-0']",
  chargeInput: "//div[@id='householdExpenses']",
  chargeOption: "//li[@id='householdExpenses-1']",
  submitButton: "//button[@type='submit']"
};

export async function fillForm(page: Page, salaire: string, depuis: string, coemprunteur: boolean) {
  await test.step("Etape: CSP", async () => {
    await page.click(LOCATORS.selectCsp);
    await page.click(LOCATORS.cspOption);
    //  await page.fill(LOCATORS.employmentSinceWhenInput, depuis);
    await page.click(LOCATORS.salaryInput);
    await page.click(LOCATORS.salaryOption);
    await page.click(LOCATORS.situationInput);
    await page.click(LOCATORS.situationOption);
    await page.click(LOCATORS.chargeInput);
    await page.click(LOCATORS.chargeOption);
    await page.getByText('Valider').click();

    if (!coemprunteur) {
      try {
        await page.getByText('Continuer en empruntant seul').click();

      } catch (error) {
      }
    }
    else {
      await page.getByText('Souscrire avec un co-emprunteur').click();
    }


  });
}

export async function skipIntro(page: Page) {
  await test.step('Etape: Pedagogie Introduction', async () => {
    await page.getByText("Commencez votre souscription").click();
    await page.getByText("Continuer").click();
    await page.getByText("Ce dont vous aurez besoin").click();
    await page.getByText("Continuer").click();
    // await page.getByText("Continuer").click();
    await page.getByText("Nous allons procéder").click();
    await page.getByText("Continuer").click({ force: true });
  });
}
export async function skipIntroConnuCredit(page: Page) {
  await test.step('Etape: Pedagogie Introduction', async () => {
    await page.getByText("Continuer").click();
    await page.getByText("Ce dont vous aurez besoin").click();
    await page.getByText("Continuer").click();
    await page.getByText("Nous allons procéder").click();
    await page.getByText("Continuer").click();
  });
}

//Continuer en empruntant seul(e) - accéder à l'étape suivante
