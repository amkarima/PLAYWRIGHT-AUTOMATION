import { test } from '@playwright/test';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import * as essentiel from '../../../pom/essentiel';

const contrat = "vac"
const partenaire = "web_cl"
const payload = "web_cl.json"
var mailrandom = "random"+Date.now()+"@test-auto.fr"
const tel = "0757592585"
const idRecto = "cni-recto3.png"
const idVerso ="cni-verso3.png"
const linxo = "ESSENTIEL_OK_2"
const assurance = "recommandée"
const carte = true

test('VAC - WEB_CL - PROSPECT', async ({ page}) => {
  await cl.generateCL(page, contrat, partenaire, payload)
  await simulateur.acceptPopupCookies(page);
  await cl.continuerAvecCetteOffre(page)
  await cl.continuer(page);
  await essentiel.setInfos(page, mailrandom,tel, "22/08/1990");
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await essentiel.selectCI(page);
  await essentiel.uploadCI(page, idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, "FRANCE", "LILLE");
  await essentiel.setStatutMarital(page);
  await essentiel.connectLinxoAccount(page, linxo);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, "10000", "01/2020");
  await essentiel.setAdresse(page, "5 RUE DE DOUAI", "59000", "500", "01/2020", false);
  await essentiel.setAssurance(page, assurance);
  await cl.setCard(page, carte);
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page,"CR", "false")
  await essentiel.setOtpAndValidate(page)
  console.log("Numéro de dossier: " + page.locator("//*[@id='contract-id']/strong").textContent());
});