import { test, Page, chromium } from '@playwright/test';
import * as api from '../../../api/Ceasy';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import jdd from '../../../datas/jdd/ceasy.json';
import * as essentiel from '../../../pom/essentiel';
import * as utils from '../../../utils/Utils';
test.describe.configure({ mode: 'parallel' });


test('SOF-151325  | CEASY-PRINTEMPS | PRINTEMPS | CRA | CREDIT', { tag: ['@sanity', '@tnr'],},async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationCraPrintemps("cra_printemps_simulation.json", token);
  const link = await api.getUrl(token,simulationId,"cra_printemps.json", "web_printemps", "cra_wis")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, mailrandom, tel)
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)
  try {
    await page.getByText("Commencer").click();
    await essentiel.setRib(page);
  } 
  catch (error) {
    await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
    await essentiel.connectLinxoAccount(page, data.linxo.account);
    await essentiel.selectFirstAccount(page);
  }
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, true);
  await essentiel.setAssurance(page, data.assurance.type);
  await cl.setCard(page, false);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page);
  await essentiel.setOtpAndValidate(page);
});

test('CEASY-T2-PRINTEMPS | PRINTEMPS | CRA | CREDIT',  async ({ page , context}) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);


  const token = await api.getToken()
  const simulationId = await api.getSimulationCraPrintemps("cra_printemps_simulation.json",  token);
  const link = await api.getUrl(token,simulationId,"cra_printemps_t2.json", "web_printemps", "cra_wis")


  await page.goto(link, { timeout: 30000 })
  await simulateur.acceptPopupCookies(page);
  await page.getByText("Commencer").click();
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Inviter").click();
  await page.getByText("Afficher un QR code").click();
  await page.getByText("Afficher le QR code").click();

  await page.click("//*[@id='qrcode']")

  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

  const coemprunteurPage: Promise<Page> = await launchBrowser(chromium, clipboardContent, "coemprunteur")
  //  await coemprunteurPage.getByText("Commencer").click();
  await (await coemprunteurPage).goto(clipboardContent)
  await simulateur.acceptPopupCookies(await coemprunteurPage);
  await (await coemprunteurPage).getByText("Commencer").click()
  await (await coemprunteurPage).getByText("Continuer").click()

  await page.getByText("Continuer").click();
  await page.getByText("Ce dont vous aurez besoin").click();
  await page.getByText("Continuer").click();
  await page.getByText("Nous allons procéder").click();
  await page.getByText("Suivant").click({ force: true });
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);

  await (await coemprunteurPage).getByText("Continuer").click();
  await (await coemprunteurPage).getByText("Ce dont vous aurez besoin").click();
  await (await coemprunteurPage).getByText("Continuer").click();
  await (await coemprunteurPage).getByText("Nous allons procéder").click();
  await (await coemprunteurPage).getByText("Suivant").click({ force: true });
  await essentiel.selectAndUpload(await coemprunteurPage, "CN", idRecto, idVerso);


  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)

  await essentiel.confirmLieuNaissance(await coemprunteurPage, data.birthPlace.country, data.birthPlace.city);

  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);

  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setCsp(await coemprunteurPage, data.csp.amount, data.csp.date);

  
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, true);

  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.setAssurance(await coemprunteurPage, data.assurance.type);


  await utils.interceptNumDossier(page)
  await (await coemprunteurPage).getByText("Confirmer").nth(1).click();

  
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifInfos(await coemprunteurPage);

  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptRecapitulatifFinancement(await coemprunteurPage);


  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);

  await essentiel.acceptConditons(await coemprunteurPage, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(await coemprunteurPage);

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
    viewport: { width: 428, height: 750 },
    isMobile: true,
    //recordVideo: {dir: "./video/"+testTitle},
  });
  const page = await context.newPage();
  //await page.goto(url);
  return page;
}