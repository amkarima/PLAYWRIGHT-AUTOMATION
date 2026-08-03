import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr+3000.json';
import {Dossier}  from '../../../utils/Utils';

test.describe.configure({ mode: 'parallel' });
const data = jdd.datas[0];

const random = Math.floor(Math.random() * 48) + 1
const idRecto = "cn-template-recto-generated-"+random+".png"
const idVerso ="cn-template-verso-generated-"+random+".png"

test('SOF-148815 | CR>3000 prospect',  { tag: ['@sanity', '@tnr'],}, async ({ page }) => {
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=3200&dueNumber=36&productId=RESERVE%20&projectLabel=FAMILY_MOVING&x1=crs&sourceId=NEOURL02`, {timeout: 30000})
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {}
  await simulateur.acceptPopupCookies(page);
  await simulateur.fastSimulation(page, data.simulation.amount, data.simulation.carte, data.simulation.type);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.skipIntro(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.skipPedagogieMiTrust(page);
  await essentiel.miTrust_se_connecter(page, data.miTrust.file);
  await page.getByText("Continuer").click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await page.getByText("Continuer").click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line)
 await essentiel.setOtpAndValidate(page);
});

test('SOF-148815 | CR>3000 prospect sans carte',  { tag: ['@tnr'],}, async ({ page }) => {
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=3200&dueNumber=36&productId=RESERVE%20&projectLabel=FAMILY_MOVING&x1=crs&sourceId=NEOURL02`, {timeout: 30000})
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {}
  await simulateur.acceptPopupCookies(page);
  await simulateur.fastSimulation(page, data.simulation.amount, data.simulation.carte, data.simulation.type);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Commencez votre souscription").click();
  await page.getByText("Continuer").click();
  await page.getByText("Ce dont vous aurez besoin").click();
  await page.getByText("Continuer").click();
 // await page.getByText("Continuer").click();
 await page.getByText("Nous allons procéder").click();
  await page.getByText("Continuer").click({force: true});
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.skipPedagogieMiTrust(page);
  await essentiel.miTrust_se_connecter(page, data.miTrust.file);
  await page.getByText("Continuer").click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await page.getByText("Continuer").click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line)
 await essentiel.setOtpAndValidate(page);
});