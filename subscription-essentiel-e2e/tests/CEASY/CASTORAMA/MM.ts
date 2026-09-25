import { test } from '@playwright/test';
import { runCeasyScenario } from '../../../helpers/ceasyRunner';
import { CeasyPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });


const scenarios = [
  {
    title: 'SOF-150944 | CEASY | MM | VAC | CREDIT',
    tags: ['@sanity', '@tnr', '@mm'],
    amount: 1223,
    campaign: "vac",
    assurance: false,
    carte: true
  }
];

const apporteur: CeasyPartner = 'MM';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runCeasyScenario(page, scenario, apporteur);
  });
});



