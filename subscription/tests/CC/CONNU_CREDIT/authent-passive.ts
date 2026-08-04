import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/autpassive.json';
import fs from 'fs';
import path from 'path';

test.describe.configure({ mode: 'parallel' });
const filePath = path.join(__dirname, 'dossiers.txt');
const data = jdd.datas[0];

test('CR-3000-CONNU-CREDIT connu credit via authent passive', async ({ page }) => {
  try {
    await page.goto(`https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=2000&dueNumber=36&productId=RESERVE%20&projectLabel=FAMILY_MOVING&x1=crs&sourceId=NEOURL02`, {timeout: 30000})
  } catch (error) {
    
  }  
  await simulateur.acceptPopupCookies(page);
  //await simulateur.fastSimulation(page, data.simulation.amount, data.simulation.carte, data.simulation.type);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, data.user.email,data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.skipPedago(page)
  await page.waitForTimeout(3000)
  await page.getByText("Continuer").click({timeout:120000});
  await essentiel.setOtpAndValidateAuthPassive(page)
  await page.getByText("Suivant").click({timeout:120000});
  await essentiel.selectAndUpload(page, data.documents.type, data.documents.front, data.documents.back);
  await essentiel.setRib(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);
});

