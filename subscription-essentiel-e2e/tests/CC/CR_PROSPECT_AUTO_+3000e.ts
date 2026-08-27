import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr+3000-auto.json';

test.describe.configure({ mode: 'parallel' });
const data = jdd.datas[0];

const random = Math.floor(Math.random() * 48) + 1
const idRecto = "cn-template-recto-generated-"+random+".png"
const idVerso ="cn-template-verso-generated-"+random+".png"

test('CR +3000 projet Auto', async ({ page }) => {
  try {
    await page.goto(    `https://rct.souscription.sofinco.fr/essentiel/?q6=web_sofinco&amount=5000&dueNumber=60&productId=AUTOPERS&projectLabel=AUTO_COMBUSTION&idcatorigin=credit_auto&mfactoryid=pour-realiser-son-projet-auto%2C-s&mfactoryid=bloc-call-to-action&mfactoryid=les-avantages-du-pret-personn-1&x1=loan&sourceId=NEOURL14`      , {timeout: 30000})
  } catch (error) {
    }
  await simulateur.acceptPopupCookies(page);
  await simulateur.fastSimulation(page, data.simulation.amount, data.simulation.carte, "PB");
  await essentiel.setInfos(page, data.user.email,data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.nextPedagogieId(page);
  await essentiel.selectAndUpload(page, data.documents.type, data.documents.front, data.documents.back);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.skipPedagogieMiTrust(page);
  await essentiel.miTrust_se_connecter(page, data.miTrust.file);
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  //await essentiel.setOtpAndValidate(page);
});