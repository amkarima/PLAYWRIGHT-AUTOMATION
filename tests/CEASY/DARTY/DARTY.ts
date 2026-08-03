import { test, Page, chromium } from '@playwright/test';
import * as api from '../../../api/Ceasy';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import jdd from '../../../datas/jdd/ceasy.json';
import * as essentiel from '../../../pom/essentiel';
import * as utils from '../../../utils/Utils';
test.describe.configure({ mode: 'parallel' });


test('SOF-150939 | CEASY-DARTY | CRA | CREDIT', { tag: ['@sanity', '@tnr'],},async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationCra("cra_darty_simulation.json", "pdv_darty", token);
  const link = await api.getUrl(token,simulationId,"cra_darty.json", "web_darty", "cra_wis")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, mailrandom, tel)
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)
  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await cl.setCard(page, false);
  await utils.interceptNumDossier(page)
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page);
  await essentiel.setOtpAndValidate(page);
});

test('SOF-150945  | Ceasy | DARTY | VAC', { tag: ['@tnr'],}, async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationVac("vac_darty_simulation.json", "web_darty", token);
  const link = await api.getUrl(token,simulationId,"vac_darty.json", "web_darty", "vac_wis")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, mailrandom, tel)
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)
  await page.getByText("Commencer").or(page.getByText("Suivant")).click();
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, true);
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditonsSeCeasy(page);
  await essentiel.setOtpAndValidateCeasy(page);
});

test('CR-3000-T2-DARTY VAC', async ({ page, context, browser }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const token = await api.getToken()
  const link = await api.getUrl(token,"simulationId","vac_darty_t2.json", "web_darty", "vac_wis")


  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await page.getByText("Commencer").click();
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Inviter").click();
  await page.getByText("Afficher un QR code").click();
  await page.getByText("Afficher le QR code").click();
  await page.click("//*[@id='qrcode']")
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

  const context2 = await browser.newContext();
  const coemprunteurPage = await context2.newPage()
  //  await coemprunteurPage.getByText("Commencer").click();
  await (await coemprunteurPage).goto(clipboardContent)
  await simulateur.acceptPopupCookies(await coemprunteurPage);
  await (await coemprunteurPage).getByText("Commencer").click()
  await (await coemprunteurPage).getByText("Continuer").click()
  await essentiel.skipIntroPid(await coemprunteurPage);
  await essentiel.selectAndUpload((await coemprunteurPage), "CN", idRecto, idVerso);

  await essentiel.skipIntroPid(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);

  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)

  await essentiel.confirmLieuNaissance(await coemprunteurPage, data.birthPlace.country, data.birthPlace.city);

  try {
  //  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
    await essentiel.setRib(page);
  } 
  catch (error) {
    await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
    await essentiel.connectLinxoAccount(page, data.linxo.account);
    await essentiel.selectFirstAccount(page);
  }

  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setCsp(await coemprunteurPage, data.csp.amount, data.csp.date);

  
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, true);

  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.setAssurance(await coemprunteurPage, data.assurance.type);


  await utils.interceptNumDossier(page)
  await (await coemprunteurPage).getByText("Confirmer").nth(1).click();

  
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptRecapitulatifFinancement(await coemprunteurPage);


  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);

  await essentiel.acceptConditons(await coemprunteurPage, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(await coemprunteurPage);
});

