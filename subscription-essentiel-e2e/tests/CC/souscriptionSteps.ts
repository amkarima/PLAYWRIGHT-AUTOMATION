import { test, Page } from '@playwright/test';
import * as essentiel from '../pom/essentiel';
import * as simulateur from '../pom/simulateur';
import * as utils from '../utils/Utils';
import { buildCraContext, buildSimulation, getSimulationCeasy, buildSimulationUrl} from "../builders/cra.builder";
import { SubscribeParams } from "../api/ceasy.interface";
import { CEASY_PARTNERS } from "../config/ceasy.config";

import { buildSimulateurUrl, simulateurParams } from '../api/CC';
import {getToken, getSimulation, getUrl, getUrlCeasy} from '../api/Ceasy';


export async function GenenrationDeDonneDeTest(jdd: any) {
  return test.step(' Génération de données de test ...', async()=>{
    const data = jdd.datas[0];
    const random = Math.floor(Math.random() * 48) + 1
    const email = `random${Date.now()}@test-auto.fr`;
    return {
        data,
        email,
        idRecto : `cn-template-recto-generated-${random}.png`,
        idVerso : `cn-template-verso-generated-${random}.png`
    };

  });
}  

export async function CommencerLaSouscriptionCC( page: Page, params : simulateurParams){
  return test.step( 'Commencer la souscription full web Circuit Court ...', async() => {
    try {
;       const url = buildSimulateurUrl(params);
        await page.goto(url);
        await simulateur.acceptPopupCookies(page);
      } catch (error) {
      }
  })
}

export async function CommencerLaSouscriptionCeasy(page: Page, campaign: string, params: SubscribeParams)  {
  const token = await getToken();
  const partner = CEASY_PARTNERS[params.apporteur];
  const simulationUrl = buildSimulationUrl(partner,campaign);
  const simulationPayload = buildSimulation({ amount: params.amount, scaleCode: partner.scaleCode,hasInsurance: params.hasInsurance, });
 
  const simulationId = await getSimulationCeasy(token, simulationUrl, simulationPayload,partner.partnerId); 
  const context = buildCraContext({
      simulationId,
      amount: params.amount,
      scaleCode: partner.scaleCode,
      duration: params.duration ?? 12,
      orderId: params.orderId,
      apporteur: partner,
    });

  const link = await getUrlCeasy(token,simulationId, context, partner.channel, partner.workflow);
 
  await page.goto(link);
}

export async function CommencerLaSouscriptionCL( page: Page, params : simulateurParams){
  return test.step( 'Commencer la souscription Full web CL ...', async() => {
  })
}

export async function miniSimulateur( page: Page, data: any){
  return test.step( ' Mini simulateur  ...', async() => {
    await page.getByText("C'est parti").click();
    await essentiel.fillForm(page, data.csp.amount, data.csp.date, false);
    await essentiel.setInfos(page, data.user.email, data.user.phone, data.user.birthDate);
  })
}

export async function ValiderLesOptins(page: Page){
 return test.step( 'Validation des options ...', async() => {
    await page.getByText("Recevez nos offres et bons plans en un clic").click();
    await page.getByText("Continuer").click();
  })
}

export async function ValiderLaPedagogie(
  page: Page,
  step: number = 1
) {
  return test.step('Validation de la Pédagogie ...', async () => {
    if (step <= 1) {
      await page.getByText("Commencez votre souscription").click();
      await page.getByText("Continuer").click();
    }
    if (step <= 2) {
      await page.getByText("Ce dont vous aurez besoin").click();
      await page.getByText("Continuer").click();
    }
    if (step <= 3) {
      await page.getByText("Nous allons procéder").click();
      await page.getByText("Continuer").click({ force: true });
    }
  });
}

export async function identification ( page: Page, data: any, idRecto :string, idVerso: string){
  return test.step( 'Identification - telechargement de la PID ...', async() => {
    await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);
    await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  })
}

export async function statusMarital(page: Page){
 await essentiel.setStatutMarital(page)
}

export async function Finances( page: Page, data: any, amount: number ){
  return test.step( 'Point finances ...', async() => {
    if(amount > 3000)
    {
      await essentiel.skipPedagogieMiTrust(page);
      await essentiel.miTrust_se_connecter(page, data.miTrust.file);
      await page.getByText("Continuer").click();
    }
    await essentiel.connectLinxoAccount(page, data.linxo.account);
    await essentiel.selectFirstAccount(page);
  })
}

export async function ProfessionEtRevenusEtAdresse( page: Page, data: any){
  return test.step( 'Profession, revenus  et adresse ...', async() => {
     await essentiel.setCsp(page, data.csp.amount, data.csp.date);
     await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, data.address.miTrust);  
  })
}

export async function Assurance( page: Page, assurance: boolean){
  return test.step( 'Proposition de l assurance ... ', async() => {
   const avecAssurance = process.env.assurance !== undefined
        ? process.env.assurance === "oui"
         :assurance ?? true;
      if(!avecAssurance)
        await essentiel.setAssurance(page,false);
      else 
         await essentiel.setAssurance(page,true);
      await utils.interceptNumDossier(page)
     
  })
}

export async function Carte( page: Page, avecCarte : boolean){
  return test.step( 'Choix de la carte ...', async() => {
      await essentiel.setCard(page,avecCarte);
  })
}

export async function Recapitulatif( page: Page){
  return test.step( ' Récapitulatif des informations ... ', async() => {
   await essentiel.checkRecapitulatifInfos(page);
   await essentiel.acceptRecapitulatifInfos(page);
  })
}
export async function OffreDeFinancement( page: Page){
  return test.step( 'Offre de financement ...', async() => {
      await essentiel.acceptRecapitulatifFinancement(page);
  })
}

export async function SE( page: Page){
  return test.step( 'Création du contrat - SE ... ', async() => {
      await essentiel.acceptNoticeSE(page);
      await essentiel.acceptConditons(page, "CR", data.simulation.carte);
      const line = process.env.CI_JOB_NAME + `: Id dossier: ${Dossier.dossier} / Id client: ${Dossier.client}\n`;
      await essentiel.setOtpAndValidate(page); 
  })
}