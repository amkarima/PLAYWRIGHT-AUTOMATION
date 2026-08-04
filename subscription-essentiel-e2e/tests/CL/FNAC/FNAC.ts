import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import * as cl from '../../../pom/CL';
import craDatas from '../../../datas/jdd/cra-fnac.json';
import * as api from '../../../api/Ceasy';



test.describe.configure({ mode: 'parallel' });




test('SOF-155841 | WEB-FNAC-CRS', { tag: ['@sanity', '@tnr'],},async ({ page }) => {
  const payload = "fnac.json"
  const data = craDatas.datas[0];
  var mailrandom = "random" + Date.now() + "@sofinco.fr"
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"

  const token = await api.getTokenCl()
  const link = await api.getUrlCl(token,"","../../datas/CL/fnac.json", "web_fnac", "crs")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await page.getByText("Je souscris à la carte").click();
  await cl.continuerAvecCetteOffre(page)
 // await cl.setEmailTelAndValidate(page, mailrandom, "0757592585")
  await essentiel.setInfos(page, mailrandom, "0757592585", "28/01/1995")

  await page.getByText("Continuer").click();
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
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
 await essentiel.setOtpAndValidate(page);
});

test('WEB-FNAC-VACR', async ({ page }) => {
  const data = craDatas.datas[0];
  var mailrandom = "random" + Date.now() + "@sofinco.fr"
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"

  const token = await api.getTokenCl()
  const link = await api.getUrlCl(token,"","../../datas/CL/fnac-vacr.json", "web_fnac", "vacr")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await page.getByText("Je souscris à la carte").click();
  await cl.continuerAvecCetteOffre(page)
 // await cl.setEmailTelAndValidate(page, mailrandom, "0757592585")
  await essentiel.setInfos(page, mailrandom, "0757592585", "28/01/1995")

  await page.getByText("Continuer").click();
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
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
 await essentiel.setOtpAndValidate(page);
});
