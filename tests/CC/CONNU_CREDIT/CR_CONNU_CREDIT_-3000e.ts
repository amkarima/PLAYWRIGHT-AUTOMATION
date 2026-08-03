import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as mysof from '../../../pom/mysof';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr-3000.json';

//test.describe.configure({ mode: 'parallel' });
const idClient = "91000128435"

test('CR-connu-credit<3000 prospect', async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  try {
    await page.goto('https://SCE_CACF_MYSOFCO:Self$care@25@rct.mon-espace-client.sofinco.fr');
    await page.click('//span[contains(text(),"Accepter")]');
    await page.goto('https://rct.mon-espace-client.sofinco.fr/auth/autologin?uid=91000128435');  } catch (error) {
    
  }  
 // await simulateur.acceptPopupCookies(page);
  await mysof.startFinancementFromMySof(page);
  await simulateur.fastSimulationAuto(page, data.simulation.amount, data.simulation.carte, data.simulation.type);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.skipIntroConnuCredit(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.setRib(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);
});