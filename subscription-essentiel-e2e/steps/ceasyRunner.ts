// helpers/ceasyRunner.ts

import { Page } from '@playwright/test';
import * as cl from '../pom/CL';
import * as simulateur from '../pom/simulateur';
import * as steps from '../steps/souscriptionSteps';
import jdd from '../datas/jdd/ceasy.json';
import { CeasyPartner } from '../config/partners';

export async function runCeasyScenario(page: Page,scenario: any,apporteur: CeasyPartner) {
  const { data, email, idRecto, idVerso } =
    await steps.GenenrationDeDonneDeTest(jdd);

  await steps.CommencerLaSouscriptionCeasy(
    page,
    scenario.campaign,
    {
      apporteur,
      amount: scenario.amount,
    }
  );

  await simulateur.acceptPopupCookies(page);
  await page.getByRole('button', { name: 'Commencer ma souscription' }).click();
  await cl.setEmailTelAndValidateCeasy(page, email, data.user.phone);
  await steps.ValiderLesOptins(page);
  await steps.ValiderLaPedagogie(page, 3);
  await steps.identification(page, data, idRecto, idVerso);
  await steps.statusMarital(page);
  await steps.Finances(page, data, scenario.amount);
  await steps.ProfessionEtRevenusEtAdresse(page, data);
  await steps.Assurance(page, scenario.assurance);
  await steps.Carte(page, scenario.carte, apporteur, 'CEASY');
  await steps.RecapitulatifInfos(page);
  await steps.OffreDeFinancement(page, scenario.assurance);
}