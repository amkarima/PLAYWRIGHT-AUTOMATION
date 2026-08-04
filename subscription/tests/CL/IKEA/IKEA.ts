import { test, chromium, Page } from '@playwright/test';
import * as essentiel from '../../../pom/essentiel';
import * as simulateur from '../../../pom/simulateur';
import * as utils from '../../../utils/Utils';
import * as cl from '../../../pom/CL';
import craDatas from '../../../datas/jdd/cra-darty.json';
import * as api from '../../../api/Ceasy';



test.describe.configure({ mode: 'parallel' });


test('SOF-155838 WEB-IKEA-CRS', { tag: ['@sanity', '@tnr'],}, async ({ page }) => {
  const data = craDatas.datas[0];
  var mailrandom = "random" + Date.now() + "@sofinco.fr"
  const random = Math.floor(Math.random() * 48) + 1
  const idRecto = "cn-template-recto-generated-" + random + ".png"
  const idVerso = "cn-template-verso-generated-" + random + ".png"

  const token = await api.getTokenCl()
  const link = await api.getUrlCl(token,"","../../datas/CL/ikea.json", "web_ikea", "crs")

  await page.goto(link)
  await simulateur.acceptPopupCookies(page);
  await cl.je_souscris_a_la_carte(page)
  await cl.continuer(page)
  await essentiel.setInfos(page, mailrandom,"0757592585", "20/01/1995");
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
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
 await essentiel.setOtpAndValidate(page);
});