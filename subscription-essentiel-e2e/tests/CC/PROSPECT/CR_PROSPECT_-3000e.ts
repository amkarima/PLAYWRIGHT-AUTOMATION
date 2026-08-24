import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr-3000.json';
import fs from 'fs';
import path from 'path';
import { Dossier } from '../../../utils/Utils';

test.describe.configure({ mode: 'parallel' });
const filePath = path.join(__dirname, 'dossiers.txt');

test('SOF-148667 | CR<3000 prospect avec carte',  { tag: ['@sanity', '@tnr'],},async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=2000&dueNumber=36&productId=CARTENEW&projectLabel=FAMILY_MOVING&x1=crs&sourceId=ADE01001`, { timeout: 30000 })
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {

  }
  await simulateur.acceptPopupCookies(page);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, "kamrouche-prestataire@sofinco.Fr", "0757597858", "01/06/2002");
  await essentiel.valider_recevez_offres_et_bon_plan(page);

  await page.getByText("Commencez votre souscription").click();
  await page.getByText("Continuer").click();

  await page.getByText("Ce dont vous aurez besoin").click();
  await page.getByText("Continuer").click();

  // await page.getByText("Continuer").click();
  await page.getByText("Nous allons procéder").click();
  await page.getByText("Continuer").click({ force: true });
  //await essentiel.nextPedagogieId(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  //await essentiel.setStatutMarital(page)

  await page.getByText("Continuer").click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
 // await page.getByText("Suivant").nth(3).click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
   await page.pause();
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line, { dossier: `${Dossier.dossier}`, client: `${Dossier.client}`, test: process.env.CI_JOB_NAME, partenaire: "Sofinco" })
  await essentiel.setOtpAndValidate(page);
 
});
test('SOF-148667b | CR<3000 prospect sans carte',  { tag: ['@tnr'],}, async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=2000&dueNumber=36&productId=CARTENEW&projectLabel=FAMILY_MOVING&x1=crs&sourceId=ADE01001`, { timeout: 30000 })
   
    //await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=2000&dueNumber=36&productId=RESERVE%20&projectLabel=FAMILY_MOVING&x1=crs&sourceId=NEOURL02`, { timeout: 30000 })
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {

  }
  await simulateur.acceptPopupCookies(page);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, "kamrouche-prestataire@sofinco.Fr", "0757597858", "01/06/2002");
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.skipIntro(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
   await page.getByText("Continuer").click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await page.getByText("Je ne souhaite pas").click();
  //await page.getByText("Suivant").nth(3).click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await page.pause()
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line, { dossier: `${Dossier.dossier}`, client: `${Dossier.client}`, test: process.env.CI_JOB_NAME, partenaire: "Sofinco" })
  await essentiel.setOtpAndValidate(page);
});
test('SOF-148667 | CR<3000 prospect sans assurance',  { tag: ['@tnr'],},async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=2000&dueNumber=36&productId=RESERVE%20&projectLabel=FAMILY_MOVING&x1=crs&sourceId=NEOURL02`, { timeout: 30000 })
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {

  }
  await simulateur.acceptPopupCookies(page);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.skipIntro(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await page.getByText("Suivant").click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, "Je ne souhaite pas");
  await utils.interceptNumDossier(page)
  await page.getByText("Suivant").nth(3).click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line, { dossier: `${Dossier.dossier}`, client: `${Dossier.client}`, test: process.env.CI_JOB_NAME, partenaire: "Sofinco" })
  await essentiel.setOtpAndValidate(page);
});

test('CR-carte<3000 prospect carte', async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=3000&dueNumber=36&productId=RESERVE+&projectLabel=MISC_OTHER&idcatorigin=credit_renouvelable&x1=crs_cb&sourceId=ADE01001`, { timeout: 30000 })
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {

  }
  await simulateur.acceptPopupCookies(page);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.skipIntro(page);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await page.getByText("Suivant").click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await page.getByText("Suivant").nth(3).click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line, { dossier: `${Dossier.dossier}`, client: `${Dossier.client}`, test: process.env.CI_JOB_NAME, partenaire: "Sofinco" })
  await essentiel.setOtpAndValidate(page);
});


async function launchBrowser(chromium, url, testTitle) {
  const browser = await chromium.launch({
    headless: false,
    arguments: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 428, height: 928 },
    isMobile: true,
    //recordVideo: {dir: "./video/"+testTitle},
  });
  const page = await context.newPage();
  //await page.goto(url);
  return page;
}