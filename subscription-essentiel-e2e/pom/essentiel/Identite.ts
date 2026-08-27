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
export async function uploadDoc(page: Page, doc: string) {
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator(LOCATORS.passportInput).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('datas/identite/' + doc);
  await page.click(LOCATORS.submitButton);
}

export async function uploadCI(page: Page, docRecto: string, docVerso: string) {
  await page.locator(LOCATORS.idRectoInput).setInputFiles("datas/identite/" + docRecto);
  await page.locator(LOCATORS.idVersoInput).setInputFiles("datas/identite/" + docVerso);
  await page.click(LOCATORS.submitButton);
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