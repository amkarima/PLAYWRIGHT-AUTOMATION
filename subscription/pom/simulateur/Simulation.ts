import { Page, test } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';

const LOCATORS = {
  projectFamilyLabel: "//label[@for='card-FAMILY']",
  projectAutoLabel: "//label[@for='card-AUTO']",

  nextStepButton: "//button[@id='next-step-button']",
  familyMovingLabel: "//label[@for='FAMILY_MOVING']",
  autoProject: "//*[contains(text(),'Vous avez trouvé un véhicule')]",
  thermiqueAutoChoice: "//label[@for='card-AUTO_COMBUSTION']",

  amountInput: "//input[@id='amountModality-number']",
  personalLoanOption: "//*[contains(text(),'Prêt personnel')]",
  suivantButton: "//*[contains(text(),'Suivant')]",
  discoverOffersButton: "//*[contains(text(),'Découvrir les offres')]",
  continueWithOfferButton: "//div[@class='simu-result__mlContinue']/button[@class='button button--primary']",
  chooseOfferButton: "//button[@class='button button--primary button--next']",
  noCardOption: "//*[@for='none']",
  submitButton: "//button[@type='submit']",
  aloneOption: "//span[contains(text(),'Seul')]",
  jeSimuleMonProjetButton: "//*[contains(text(),'Je simule mon projet')]",
  simulerCRPremium: "//*[contains(text(),'Simuler un CR Premium')]"

};

export async function fastSimulation(page: Page, montant: string, carte: boolean, contrat: string): Promise<void> {

 /* await test.step('Etape: Type de projet', async () => {
    await page.click(LOCATORS.projectFamilyLabel);
    await page.click(LOCATORS.nextStepButton);
    await page.click(LOCATORS.familyMovingLabel);
    await page.click(LOCATORS.nextStepButton);
  });

  await test.step('Etape: Montant du projet', async () => {
    await page.fill(LOCATORS.amountInput, montant);
    await page.click('body');
    if (contrat === "PB") {
      await page.click(LOCATORS.personalLoanOption);
    }
    await page.click(LOCATORS.suivantButton);
  });

  await test.step("Etape: Choix de l'offre", async () => {
    await page.click(LOCATORS.discoverOffersButton, { force: true });
    await page.click(LOCATORS.continueWithOfferButton);
    await page.click(LOCATORS.chooseOfferButton);

  });*/
  /*try {
    if (contrat !== "PB") {
      if (!carte) {
        await page.click(LOCATORS.noCardOption);
      }
      await page.click(LOCATORS.submitButton);
    }
  } catch (error) {
    
  }*/


  /*await test.step("Etape: Co-emprunteur", async () => {
    await page.click(LOCATORS.aloneOption);
    await page.click(LOCATORS.submitButton);
  });*/
}

export async function fastSimulationAuto(page: Page, montant: string, carte: boolean, contrat: string): Promise<void> {

  await test.step('Etape: Type de projet', async () => {
    await page.click(LOCATORS.projectAutoLabel);
    await page.click(LOCATORS.nextStepButton);
    await page.click(LOCATORS.autoProject);
    await page.click(LOCATORS.nextStepButton);
    await page.click(LOCATORS.thermiqueAutoChoice);
    await page.click(LOCATORS.nextStepButton);
  });

  await test.step('Etape: Montant du projet', async () => {
    await page.fill(LOCATORS.amountInput, montant);
    await page.click('body');
    if (contrat === "PB") {
      await page.click(LOCATORS.personalLoanOption);
    }
    await page.click(LOCATORS.suivantButton);
  });

  await test.step("Etape: Choix de l'offre", async () => {
    await page.click(LOCATORS.discoverOffersButton, { force: true });
    await page.click(LOCATORS.continueWithOfferButton);
//    await page.click(LOCATORS.chooseOfferButton);
   /* if (contrat !== "PB") {
      if (!carte) {
        await page.click(LOCATORS.noCardOption);
      }
      await page.click(LOCATORS.submitButton);
    }*/
  });

 /* if (contrat !== "PB") {
    if (!carte) {
      await page.click(LOCATORS.noCardOption);
    }
    await page.click(LOCATORS.submitButton);
  }

  await test.step("Etape: Co-emprunteur", async () => {
    await page.click(LOCATORS.aloneOption);
    await page.click(LOCATORS.submitButton);
  });*/
}

export async function goToAtijariwafaSimulation(page: Page): Promise<void> {
  await test.step('Etape: Site vitrine - Atijariwafa', async () => {
    await page.click(LOCATORS.jeSimuleMonProjetButton);
  });
}
export async function goToAmundi(page: Page): Promise<void> {
  await test.step('Etape: Site vitrine - Amundi', async () => {
    await page.click(LOCATORS.jeSimuleMonProjetButton);
  });
}
  export async function goToBforbank(page: Page): Promise<void> {
    await test.step('Etape: Site vitrine - Bforbank', async () => {
      await page.click(LOCATORS.jeSimuleMonProjetButton);
    });
}
export async function goToCrPremium(page: Page): Promise<void> {
  await test.step('Etape: Site vitrine - Client premium', async () => {
    await page.click(LOCATORS.simulerCRPremium);
  });
}