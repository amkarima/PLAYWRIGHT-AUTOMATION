import { test, Page, chromium } from '@playwright/test';
import * as api from '../../../api/Ceasy';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import jdd from '../../../datas/jdd/ceasy.json';
import * as essentiel from '../../../pom/essentiel';
import * as utils from '../../../utils/Utils';
test.describe.configure({ mode: 'parallel' });


test('SOF-150944  | CEASY-MM | VAC | CREDIT', { tag: ['@sanity', '@tnr'],},async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationVac("vac_mm_simulation.json", "web_cl", token);
  const link = await api.getUrl(token,simulationId,"vac_mm.json", "web_cl", "vac_wis")

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
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, true );
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page);
  await essentiel.setOtpAndValidate(page);
});

/*test('Ceasy | FNAC | CRA | COMPTANT', async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationCra("cra_fnac_simulation.json", "pdv_fnac", token);
  const link = await api.getUrl(token,simulationId,"cra_fnac_comptant.json", "web_fnac", "cra_wis") 

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, mailrandom, tel)
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, false);
  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditonsSeCeasy(page);
  await essentiel.setOtpAndValidateCeasy(page);
});

test('Ceasy | FNAC | VAC', async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationVac("vac_fnac_simulation.json", "web_fnac", token);
  const link = await api.getUrl(token,simulationId,"vac_fnac.json", "web_fnac", "vac_wis")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, mailrandom, tel)
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditonsSeCeasy(page);
  await essentiel.setOtpAndValidateCeasy(page);
});

test('Ceasy | FNAC | CRS', async ({ page }) => {
  const data = jdd.datas[0];
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"
  var mailrandom = "random"+Date.now()+"@test-auto.fr"
  const tel = "0757592585"

  const token = await api.getToken()
  const simulationId = await api.getSimulationCrs("crs_fnac_simulation.json", token);
  const link = await api.getUrl(token,simulationId,"crs_fnac.json", "web_fnac", "crs_wis")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, mailrandom, tel)
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditonsSeCeasy(page);
  await essentiel.setOtpAndValidateCeasy(page);
});*/