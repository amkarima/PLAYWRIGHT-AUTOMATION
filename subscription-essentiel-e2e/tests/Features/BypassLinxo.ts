import { test } from '@playwright/test';
import jdd from '../../datas/jdd/cr-3000.json';
import * as steps from '../../steps/souscriptionSteps';

test('Bypass Linxo : Banque KO ..', { tag: ['@refacto', '@tnr', '@bypass-linxo'] }, async ({ page }) => {
  const params = {
    amount: 2000
  };

  const { data, idRecto, idVerso } = await steps.GenenrationDeDonneDeTest(jdd);

  await steps.CommencerLaSouscriptionCC(page, params);
  await steps.miniSimulateur(page, data);
  await steps.ValiderLesOptins(page);
  await steps.ValiderLaPedagogie(page);
  await steps.identification(page, data, idRecto, idVerso);
  await steps.FinancesBypassLinxo(page, data, params.amount);
  await steps.ProfessionEtRevenusEtAdresse(page, data);
  await steps.Assurance(page, false);
  await steps.Carte(page, true);
 await steps.RecapitulatifInfos(page);
  await steps.OffreDeFinancement(page, false);

});


test('Bypass Linxo : Banque pas dans la liste', { tag: ['@refacto', '@tnr', '@bypass-linxo'] }, async ({ page }) => {
  const params = {
    amount: 2000
  };

  const { data, idRecto, idVerso } = await steps.GenenrationDeDonneDeTest(jdd);

  await steps.CommencerLaSouscriptionCC(page, params);
  await steps.miniSimulateur(page, data);
  await steps.ValiderLesOptins(page);
  await steps.ValiderLaPedagogie(page);
  await steps.identification(page, data, idRecto, idVerso);
  await steps.bypassBanqueNotExist(page, data, params.amount);
  await steps.ProfessionEtRevenusEtAdresse(page, data);
  await steps.Assurance(page, true);
  await steps.Carte(page, true);
  await steps.RecapitulatifInfos(page);
  await steps.OffreDeFinancement(page, true);
});