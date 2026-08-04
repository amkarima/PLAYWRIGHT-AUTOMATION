import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as mysof from '../../../pom/mysof';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr+3000.json';

//test.describe.configure({ mode: 'parallel' });
const idClient = "92398286246"

async function runTest(page: Page, data: any) {
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"

  await simulateur.acceptPopupCookies(page);
  await mysof.startFinancementFromMySof(page);
  await simulateur.fastSimulationAuto(page, data.simulation.amount, data.simulation.carte, data.simulation.type);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.skipIntroConnuCredit(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.skipPedagogieMiTrust(page);
  await essentiel.miTrust_se_connecter(page, data.miTrust.file);
  await essentiel.setRib(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await page.getByText("Suivant").nth(3).click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);
}

for (let i = 0; i < jdd.datas.length; i++) {
  test(jdd.datas[i].title, { tag: jdd.datas[i].tags }, async () => {
    const page: Page = await utils.launchBrowser(chromium, `${mysof.env}/auth/autologin?uid=${idClient}`);
    await runTest(page, jdd.datas[i]);
  });
}