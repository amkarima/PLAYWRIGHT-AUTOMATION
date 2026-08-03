import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/pb.json';
import {Dossier}  from '../../../utils/Utils';

test.describe.configure({ mode: 'parallel' });
const data = jdd.datas[0];
const random = Math.floor(Math.random() * 48) + 1
const idRecto = "cn-template-recto-generated-"+random+".png"
const idVerso ="cn-template-verso-generated-"+random+".png"

test('SOF-149125 | PB>3000 prospect',  { tag: ['@sanity', '@tnr'],}, async ({ page }) => {
  try {
    await page.goto('https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=4000&dueNumber=60&productId=PBPERSO%20&projectLabel=FAMILY_MOVING&idcatorigin=home_page&x1=loan&sourceId=NEOURL41', {timeout: 30000})
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
  await essentiel.skipPedagogieMiTrust(page);
  await essentiel.miTrust_se_connecter(page, data.miTrust.file);
  await page.getByText("Continuer").click({timeout: 120000});
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line)
 await essentiel.setOtpAndValidate(page);
  });

  
test('SOF-149125 | PB>3000 prospect sans assurance',  { tag: ['@tnr'],}, async ({ page }) => {
  try {
    await page.goto('https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=4000&dueNumber=60&productId=PBPERSO%20&projectLabel=FAMILY_MOVING&idcatorigin=home_page&x1=loan&sourceId=NEOURL41', {timeout: 30000})
    //await page.goto(    `${essentiel.env}/parcours-simulateur`      , {timeout: 30000})
  } catch (error) {
    
  }
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
  await page.getByText("Continuer").click({timeout: 120000});
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, "Je ne souhaite pas");
  await utils.interceptNumDossier(page)
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line)
 await essentiel.setOtpAndValidate(page);
  });

  test('SOF-149277 | PB >20k prospect',  { tag: ['@sanity', '@tnr'],}, async ({ page }) => {
    try {
      await page.goto('https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=21000&dueNumber=84&productId=PBPERSO%20&projectLabel=FAMILY_MOVING&idcatorigin=home_page&x1=loan&sourceId=NEOURL41', {timeout: 30000})
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
    await essentiel.skipPedagogieMiTrust(page);
    await essentiel.miTrust_se_connecter(page, data.miTrust.file);
    await page.getByText("Continuer").click({timeout: 120000});
    await essentiel.connectLinxoAccount(page, data.linxo.account);
    await essentiel.selectFirstAccount(page);
    await essentiel.setCsp(page, data.csp.amount, data.csp.date);
    await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
    await essentiel.setAssurance(page, data.assurance.type);
    await utils.interceptNumDossier(page)
    await essentiel.acceptRecapitulatifInfos(page);
    await essentiel.acceptRecapitulatifFinancement(page);
    await essentiel.acceptNoticeSE(page);
    await essentiel.acceptConditons(page, "CR", data.simulation.carte);
    const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
    await utils.sendToSlack(line)
   await essentiel.setOtpAndValidate(page);
    });
  