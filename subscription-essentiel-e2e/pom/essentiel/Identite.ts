import { Page, test } from '@playwright/test';

const LOCATORS = {
  suivantButton: "//*[contains(text(),'Continuer')]",
  passeportOption: "//span[contains(text(),'Passeport')]",
  identiteOption: "//span[contains(text(),'Identité')]",
  okButton: "//button[contains(text(),'Ok')]",
  passportInput: "input[id='passport']",
  jePhotographieMaPieceButton: "button[id='photo-guide-next']",
  submitButton: "//button[@type='submit']",
  idRectoInput: "//input[@id='id-recto']",
  idVersoInput: "//input[@id='id-verso']",
  birthCountryInput: "//input[@id='birth-country']",
  birthCityInput: "//*[@id = 'birth-city']",
  birthdate: "//*[@id = 'birthdate']"
};
export async function skipIntroPid(page: Page){
  await page.getByText("Continuer").click();
  await page.getByText("Ce dont vous aurez besoin").click();
  await page.getByText("Continuer").click();
  await page.getByText("Nous allons procéder").click();
  await page.getByText("Continuer").click({ force: true });
}
export async function selectAndUpload(page: Page, document: string, docRecto: string, docVerso: string) {
  await test.step("Etape: PID", async () => {
    if (document === "Passeport") {
      await selectPasseport(page);
      await uploadDoc(page, docRecto);
    } else {
      await selectCI(page);
      await uploadCI(page, docRecto, docVerso);
    }
  });
}

export async function selectAndUploadV2(page: Page, document: string, docRecto: string, docVerso: string) {
  await test.step("Etape: PID", async () => {
    if (document === "Passeport") {
      await selectPasseport(page);
      await uploadDoc(page, docRecto);
    } else {
      await selectCIv2(page);
      await uploadCI(page, docRecto, docVerso);
    }
  });
}

export async function selectPasseport(page: Page) {
  await page.click(LOCATORS.suivantButton, { force: true });
  await page.click(LOCATORS.passeportOption);
  try {
    await page.click("//*[contains(text(),'Importer ma pièce')]",{timeout: 3000})

  } catch (error) {
    
  }

  await page.click(LOCATORS.okButton);
}

export async function selectCI(page: Page) {
  await page.click(LOCATORS.identiteOption);
  try {
    await page.click("//*[contains(text(),'Ajoutez votre justificatif')]",{timeout: 3000})

  } catch (error) {
    
  }
  //await page.click(LOCATORS.jePhotographieMaPieceButton);
await page.getByText("Importer ma pièce d'identité manuellement").click();
  //await page.click(LOCATORS.okButton);
}

export async function selectCIv2(page: Page) {

  try {
    await page.click("//*[contains(text(),'Je photographie ma pièce d'identité')]",{timeout: 3000})

  } catch (error) {
    
  }
}
export async function uploadDoc(page: Page, doc: string, maxRetries: number = 2) {
  await test.step(`Upload passport ${doc}`, async () => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator(LOCATORS.passportInput).click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles('datas/identite/' + doc);
      await page.click(LOCATORS.submitButton);

      // Attendre un court instant pour que le message d'erreur apparaisse ou que la page avance
      await page.waitForTimeout(2000);

      // Détecter un message d'erreur de conformité (libellés partiels tolérés)
      const errorVisible = await page.locator("text=/ne semble pas conforme|renvoyer un justificatif|justificatif.*conforme/i").first().isVisible().catch(() => false);

      if (!errorVisible) {
        // Pas d'erreur détectée : supposer réussite
        return;
      }

      // Si erreur et qu'il reste des tentatives, réessayer
      if (attempt <= maxRetries) {
        console.warn(`Upload échoué (tentative ${attempt}). Nouvelle tentative...`);
        // Tenter de fermer le message d'erreur si un bouton OK existe
        await page.locator(LOCATORS.okButton).click().catch(() => {});
        // Revenir à l'état d'upload (si nécessaire) : tenter d'ouvrir à nouveau l'interface d'import
        await page.locator("text=Importer ma pièce", { hasText: 'Importer ma pièce' }).click().catch(() => {});
        // petite attente avant la nouvelle tentative
        await page.waitForTimeout(800);
        continue;
      }

      // Dernière tentative échouée
      throw new Error('Upload du document refusé : message de non-conformité après plusieurs tentatives');
    }
  });
}

export async function waitForOCRResponse(page: Page) {
  const response = await page.waitForResponse(response => response.url().includes('/supportingDocuments') && response.request().method() === 'POST', { timeout: 30000 });
  return await response.json();
}

export async function uploadCI(page: Page, docRecto: string, docVerso: string, maxRetries: number = 2) {
  await test.step(`Upload CI ${docRecto} / ${docVerso}`, async () => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      console.log(`Upload CI - tentative ${attempt}/${maxRetries + 1}`);

      await page.locator(LOCATORS.idRectoInput).setInputFiles(`datas/identite/${docRecto}`);
      await page.locator(LOCATORS.idVersoInput).setInputFiles(`datas/identite/${docVerso}`);

      const ocrResponsePromise = waitForOCRResponse(page);

      await page.locator(LOCATORS.submitButton).click();

      const ocrResult = await ocrResponsePromise;

      console.log('Réponse OCR :', JSON.stringify(ocrResult, null, 2));

      if (ocrResult.status !== 'ERR_OCR_KO') {
        console.log(`CI acceptée à la tentative ${attempt}`);
        return;
      }

      console.warn(`OCR KO à la tentative ${attempt} : ${ocrResult.message}`);

      if (attempt <= maxRetries) {
        await page.waitForTimeout(800);
        continue;
      }

      throw new Error(`Upload des pièces d’identité refusé après ${maxRetries + 1} tentatives : ${ocrResult.message}`);
    }
  });
}

export async function uploadRandomCI(page: Page) {
  await page.locator(LOCATORS.idRectoInput).setInputFiles("datas/identite/" + "");
  await page.locator(LOCATORS.idVersoInput).setInputFiles("datas/identite/" + "");
  await page.click(LOCATORS.submitButton);
}

export async function confirmLieuNaissance(page: Page, pays: string, ville: string) {
  await page.getByRole('combobox', { name: 'Pays de naissance (ex :' }).fill('FRA');
  await page.getByRole('option', { name: 'FRANCE' }).click();
  await page.getByRole('combobox', { name: 'Ville de naissance ou code' }).fill('LILLE');
  await page.getByRole('option', { name: 'LILLE (59000)' }).click();
  await page.fill(LOCATORS.birthdate, "20/01/"+(1976+(Math.random()*30)))
 await page.click(LOCATORS.submitButton);

}

export async function validerRecevezOffresEtBonPlan(page: Page) {
  await page.waitForTimeout(3000);
  await page.waitForLoadState("load")
  await page.click(LOCATORS.submitButton);
}