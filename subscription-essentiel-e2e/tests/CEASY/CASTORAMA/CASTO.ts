import { test } from '@playwright/test';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import jdd from '../../../datas/jdd/ceasy.json';
import * as steps from '../../../steps/souscriptionSteps';

test.describe.configure({ mode: 'parallel' });

test('SOF-155911 | CEASY-CASTORAMA | CRA | CREDIT', { tag: ['@refacto', '@tnr'] }, async ({ page }) => {
  const { data, email, idRecto, idVerso } = await steps.GenenrationDeDonneDeTest(jdd);

  await steps.CommencerLaSouscriptionCeasy(page, 'cra', { apporteur: 'CASTORAMA', amount: 2500 });

  await simulateur.acceptPopupCookies(page);
  await cl.setEmailTelAndValidateCeasy(page, email, data.tel);

  await steps.ValiderLesOptins(page);
  await steps.ValiderLaPedagogie(page, 3);
  await steps.identification(page, data, idRecto, idVerso);
  await steps.statusMarital(page);
  await steps.Finances(page, data, 2500);
  await steps.ProfessionEtRevenusEtAdresse(page, data);
  await steps.Assurance(page, false);
  await steps.Carte(page, true);
  await steps.Recapitulatif(page);
  await steps.OffreDeFinancement(page);
});


