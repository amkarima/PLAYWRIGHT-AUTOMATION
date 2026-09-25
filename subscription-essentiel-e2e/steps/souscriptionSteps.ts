import { test, Page } from '@playwright/test';
import * as essentiel from '../pom/essentiel';
import * as simulateur from '../pom/simulateur';
import * as utils from '../utils/Utils';
import * as api from '../api/Ceasy';
import { buildCraContext, buildSimulation, getSimulationCeasy, buildSimulationUrl} from "../builders/cra.builder";
import { SubscribeParams } from "../api/ceasy.interface";
import { getPartnerConfig } from "../config/partners";

import { buildSimulateurUrl, simulateurParams } from '../api/CC';
import {getToken, getTokenCl, getSimulation, getUrl, getUrlCeasy} from '../api/Ceasy';


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
        const url = buildSimulateurUrl(params);
        await page.goto(url);
        utils.interceptCalculator(page);
        await simulateur.acceptPopupCookies(page);
      } catch (error) {
      }
  })
}

export async function CommencerLaSouscriptionCeasy(page: Page, campaign: string, params: SubscribeParams)  {
  
  const token = await getToken();
  const partner = getPartnerConfig('ceasy', params.apporteur, {
    amount: params.amount,
    duration: params.duration,  
    hasInsurance: params.hasInsurance,
    campaign: campaign || undefined,
  });



  const simulationUrl = buildSimulationUrl(partner,campaign || partner.campaign || 'cra');
  const simulationPayload = buildSimulation({
  amount: params.amount,
  duration: params.duration,
  scaleCode: partner.scaleCode!,
  businessProviderId: partner.businessProviderId!,
  hasInsurance: params.hasInsurance,
});

const applicationId =
  campaign === 'vac'
    ? partner.vacApplicationId ?? partner.applicationId
    : campaign === 'crs'
      ? partner.crsApplicationId ?? partner.applicationId
      : partner.applicationId;
      
  const simulationId = await getSimulationCeasy(token, simulationUrl, simulationPayload, applicationId!);
  const context = buildCraContext({
      simulationId,
      amount: params.amount,
      scaleCode: partner.scaleCode ?? 'CASCR12',
      duration: params.duration ?? partner.duration ?? 12,
      orderId: params.orderId,
      apporteur: {
        businessProviderId: partner.businessProviderId!,
        scaleId: partner.scaleId!,
        frontCode: partner.frontCode!,
        returnUrl: partner.returnUrl!,
        exchangeUrl: partner.exchangeUrl!,
      },
    });

   const link = await getUrlCeasy(token, simulationId, context, partner.channel ?? 'web_castorama', partner.workflow ?? 'cra_wis');

  await page.goto(link);
}

export async function CommencerLaSouscriptionCL2( page: Page,campaign: string, params : simulateurParams){
  return test.step( 'Commencer la souscription Full web CL ...', async() => {
    
   const partner = getPartnerConfig('ceasy', params.apporteur, {
    amount: params.amount,
    duration: params.duration,  
    hasInsurance: params.hasInsurance,
    campaign: campaign || undefined,
  });
   const token = await api.getTokenCl()
   const link = await api.getUrlCl(token,"","../../datas/CL/darty.json", "web_darty", "cra")
   await page.goto(link)
  })
}



export async function CommencerLaSouscriptionCL(page: Page,campaign: string,params: SubscribeParams) {

  const token = await api.getTokenCl();
  const partner = getPartnerConfig('cl', params.apporteur, {
    amount: params.amount,
    duration: params.duration,
    hasInsurance: params.hasInsurance,
    campaign,
  });

  console.log('partner CL', partner);

  const link = await api.getUrlCl(
    token,
    '',
    partner.contextFile!,
    partner.channel!,
    campaign,
  );

  await page.goto(link);
}


export async function miniSimulateur( page: Page, data: any){
  return test.step( ' Mini simulateur  ...', async() => {
    await page.getByRole('button', { name: 'Commencer ma souscription' }).click();
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
      
    }
     try {
            await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
            await essentiel.connectLinxoAccount(page, data.linxo.account);
            await essentiel.selectFirstAccount(page);
         
        } catch (error) {
          await page.getByText("Commencer").click();
          await essentiel.setRib(page);
          }
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

export async function Carte( page: Page, avecCarte : boolean, partner='web_sofinco', parcours="CC"){
  return test.step( 'Choix de la carte ...', async() => {
    if(parcours == 'CC')
      await essentiel.setCard(page,avecCarte);
    else if(parcours == 'CEASY')
      await essentiel.setCardCeasy(page,avecCarte,partner,parcours)
    else if(parcours == 'CL')  
      await essentiel.setCardCeasy(page,avecCarte,partner,parcours)// a changer si besoin 
  })
}

export async function RecapitulatifInfos( page: Page, ){
  return test.step( ' Récapitulatif des informations ... ', async() => {
  // await essentiel.checkRecapitulatifInfos(page);
   await essentiel.acceptRecapitulatifInfos(page);
  })
}

export async function OffreDeFinancement( page: Page, assurance: boolean){
  return test.step( 'Offre de financement ...', async() => {
    //  await essentiel.checkRecapitulatifFinancement(page,assurance);
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

export async function mockLinxoKO(page: Page) {
  await page.route('**/bankStatementsCheck', async route => {
    const response = await route.fetch();
    const body = await response.json();

    await route.fulfill({
      response,
      json: {
        ...body,
        status: "2"
      }
    });
  });
}

export async function FinancesBypassLinxo(page: Page, data: any, amount: number) {
  return test.step('Point finances - bypass Linxo KO ...', async () => {
    await page.getByText("Continuer").click();
    await mockLinxoKO(page);
    await essentiel.connectLinxoAccount(page, data.linxo.account);
    await essentiel.selectFirstAccount(page);
  });
}


export async function bypassBanqueNotExist(page: Page, data: any, amount: number) {
  return test.step('Point finances - bypass Linxo banque pas dans la liste ...', async () => {
    await essentiel.bypassBanqueNotExist(page, data.linxo.account);
    await essentiel.setRib(page);
  });
}