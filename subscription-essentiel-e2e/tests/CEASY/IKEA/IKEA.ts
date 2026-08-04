import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import * as cl from '../../../pom/CL';
import craDatas from '../../../datas/jdd/cra-darty.json';
import * as api from '../../../api/Ceasy';
import jdd from '../../../datas/jdd/ceasy.json';



test.describe.configure({ mode: 'parallel' });
test('SOF-157989 CEASY-IKEA | CRA | CREDIT', { tag: ['@sanity', '@tnr'],}, async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationCraIkea("cra_ikea_simulation.json", "web_ikea", token);
  const link = await api.getUrl(token,simulationId,"cra_ikea.json", "web_ikea", "cra_wis")

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
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page);
  await essentiel.setOtpAndValidate(page);
});

test('SOF-157991 CEASY-IKEA | VAC', { tag: ['@sanity', '@tnr'],}, async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationVacIkea("vac_ikea_simulation.json", "web_ikea", token);
  const link = await api.getUrl(token,simulationId,"vac_ikea.json", "web_ikea", "vac_wis")

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
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page);
  await essentiel.setOtpAndValidate(page);
});