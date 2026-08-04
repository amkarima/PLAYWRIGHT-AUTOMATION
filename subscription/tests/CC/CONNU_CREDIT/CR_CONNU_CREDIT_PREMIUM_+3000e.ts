import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as mysof from '../../../pom/mysof';

import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr+3000.json';

//test.describe.configure({ mode: 'parallel' });
const idClient = "92374850825"

async function runTest(page: Page, data: any) {
  await simulateur.acceptPopupCookies(page);
  await page.waitForTimeout(10000)
  await mysof.startFinancementFromMySof(page);
  await page.goto(`${essentiel.env}/agile-premium`)
  await page.click("//*[contains(text(),'Simuler un CR Premium')]")
  await simulateur.fastSimulation(page, data.simulation.amount, data.simulation.carte, data.simulation.type);
  await essentiel.nextPedagogieId(page);
  await essentiel.selectAndUpload(page, data.documents.type, data.documents.front, data.documents.back);
  await essentiel.setRib(page);
  await essentiel.setAssurance(page, data.assurance.type);
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