import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as mysof from '../../../pom/mysof';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr-3000.json';

//test.describe.configure({ mode: 'parallel' });
const idClient = "92811801905"

test('sign', async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  try {
    await page.goto('https://SCE_CACF_MYSOFCO:Self$care@25@rct.mon-espace-client.sofinco.fr');
  } catch (error) {
    
  }  
  await page.click('//span[contains(text(),"Accepter")]');
  await page.goto('https://rct.mon-espace-client.sofinco.fr/auth/autologin?uid=91000128435');
  await page.getByText("Signer mon contrat").click();

  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);
});