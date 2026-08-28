import { test, chromium, Page } from '@playwright/test';
import jdd from '../../../datas/jdd/cr+3000.json';
import * as steps from '../../../steps/souscriptionSteps';
test.describe.configure({ mode: 'parallel' });

const scenarios = [
  {
    title: 'SOF-148815 | CR>3k prospect avec carte',
    tags: ['@refacto', '@tnr'],
    amount: 3001,
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-148815 | CR>3k prospect sans carte',
    tags: ['@refacto', '@tnr'],
    amount: 4000,
    assurance: false,
    carte: false
  },
  {
    title: 'SOF-148815b | CR>3k prospect sans assurance',
    tags: ['@refacto', '@tnr'],
    amount: 5000,
    assurance: true,
    carte: false
  },
  {
    title: 'SOF-148815b | CR>3k prospect avec assurance avec carte',
    tags: ['@refacto', '@tnr'],
    amount: 4500,
    assurance: true,
    carte: true
  }
];

scenarios.forEach(({ title, amount, assurance, carte, tags }) => {

  test(title, { tag: tags }, async ({ page }) => {
     const params ={
          amount : amount
      }
      const { data, idRecto, idVerso } =await steps.GenenrationDeDonneDeTest(jdd);
      
      await steps.CommencerLaSouscriptionCC(page, params);
      await steps.miniSimulateur(page, data);
      await steps.ValiderLesOptins(page);
      await steps.ValiderLaPedagogie(page);
      await steps.identification(page, data, idRecto, idVerso);
     /* await steps.Finances(page, data, amount);
      await steps.ProfessionEtRevenusEtAdresse(page, data);
      await steps.Assurance(page, assurance);
      await steps.Carte(page, carte);
      await steps.Recapitulatif(page);
      await steps.OffreDeFinancement(page);*/

  });

});