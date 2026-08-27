import { test, chromium, Page } from '@playwright/test';
import * as steps from '../../../steps/souscriptionSteps';
test.describe.configure({ mode: 'parallel' });
import jdd from '../../../datas/jdd/pb.json';
import {Dossier}  from '../../../utils/Utils';

const scenarios = [
  {
    title: 'SOF-149125 | PB>3k prospect avec assurance',
    tags: ['@refacto', '@tnr'],
    amount: 3001,
    assurance: true
  },
  {
    title: 'SOF-149125 | PB>3k prospect sans assurance',
    tags: ['@refacto', '@tnr'],
    amount: 4000,
    assurance: false
  }
];

scenarios.forEach(({ title, amount, assurance, tags }) => {

  test(title, { tag: tags }, async ({ page }) => {
     const params ={
          amount : amount,
          productId : "PBPERSO",
          x1:"loan",
          sourceId:"NEOURL41"
      }
      const { data, idRecto, idVerso } =await steps.GenenrationDeDonneDeTest(jdd);
      
      await steps.CommencerLaSouscriptionCC(page, params);
      await steps.miniSimulateur(page, data);
      await steps.ValiderLesOptins(page);
      await steps.ValiderLaPedagogie(page);
      await steps.identification(page, data, idRecto, idVerso);
      await steps.Finances(page, data, amount);
      await steps.ProfessionEtRevenusEtAdresse(page, data);
      await steps.Assurance(page, assurance);
      await steps.Recapitulatif(page);
      await steps.OffreDeFinancement(page);

  });

});