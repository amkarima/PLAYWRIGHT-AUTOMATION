import { test, Page, chromium } from '@playwright/test';
import * as api from '../../../api/Ceasy';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import jdd from '../../../datas/jdd/ceasy.json';
import * as essentiel from '../../../pom/essentiel';
import * as utils from '../../../utils/Utils';
import * as steps from '../../../steps/souscriptionSteps';
test.describe.configure({ mode: 'parallel' });


const scenarios = [
  {
    title: 'SOF-155911 | CEASY-CASTORAMA | CRA | CREDIT',
    tags: ['@refacto', '@tnr'],
    amount: 3001,
    campaign: "cra",
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-157931 | Ceasy | CASTORAMA | VAC',
    tags: ['@refacto', '@tnr'],
    amount: 4000,
    campaign: "cra",
    assurance: false,
    carte: false
  }
];

scenarios.forEach(({ title, campaign, amount, assurance, carte, tags }) => {

  test(title, { tag: tags }, async ({ page }) => {
     const { data,email, idRecto, idVerso } =await steps.GenenrationDeDonneDeTest(jdd);
      
       //await steps.CommencerLaSouscriptionCeasy(page, "https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/web_castorama/campaigns/cra/simulations/revolvings/calculate","cra_castorama_simulation.json", "creditPartner")
       await steps.CommencerLaSouscriptionCeasy(page, campaign, {apporteur: "CASTORAMA",amount: 2500});

      // await simulateur.acceptPopupCookies(page);
      // await cl.setEmailTelAndValidateCeasy(page, email, data.tel)
       /*await steps.ValiderLesOptins(page);
       await steps.ValiderLaPedagogie(page,3);
       await steps.identification(page, data, idRecto, idVerso);
       await steps.statusMarital(page);
       await steps.Finances(page, data, amount);
       // await steps.ProfessionEtRevenusEtAdresse(page, data);
       // await steps.Assurance(page, assurance);
       // await steps.Carte(page, carte);
       // await steps.Recapitulatif(page);
       // await steps.OffreDeFinancement(page);*/
  });

});


