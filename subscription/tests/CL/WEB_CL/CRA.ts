import { test } from '@playwright/test';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import * as essentiel from '../../../pom/essentiel';
import * as utils from '../../../utils/Utils';
import jdd from '../../../datas/jdd/cr-3000.json';
import fs from 'fs';
import path from 'path';
import { Dossier } from '../../../utils/Utils';



const contrat = "cra"
const partenaire = "web_cl"
const payload = "web_cl.json"
var mailrandom = "random"+Date.now()+"@test-auto.fr"
const tel = "0757592585"
const idRecto = "cni-recto3.png"
const idVerso ="cni-verso3.png"
const linxo = "ESSENTIEL_OK_2"
const assurance = "recommandée"
const carte = true

test('CRA - WEB_CL - PROSPECT', async ({ page}) => {
  const data = jdd.datas[0];

  await cl.generateCL(page, contrat, partenaire, payload)
  await simulateur.acceptPopupCookies(page);
  await cl.continuerAvecCetteOffre(page)
  await cl.setEmailTelAndValidate(page, mailrandom, tel)
  await cl.continuer(page);
  await page.getByText("C'est parti").click();
  await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
  await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  await essentiel.valider_recevez_offres_et_bon_plan(page);
  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
  await essentiel.connectLinxoAccount(page, data.linxo.account);
  await essentiel.selectFirstAccount(page);
  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);
  await essentiel.setAssurance(page, data.assurance.type);
  await utils.interceptNumDossier(page)
  await page.getByText("Je ne souhaite pas").click();
  await page.getByText("Suivant").nth(3).click();
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptNoticeSE(page);
  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
  await utils.sendToSlack(line, { dossier: `${Dossier.dossier}`, client: `${Dossier.client}`, test: process.env.CI_JOB_NAME, partenaire: "Sofinco" })
  await essentiel.setOtpAndValidate(page);
});