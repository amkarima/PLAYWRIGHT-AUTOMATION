import { test } from '@playwright/test';
import { runCeasyScenario } from '../../../helpers/ceasyRunner';
import { CeasyPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });


const scenarios = [
  {
    title: 'SOF-xxx | CEASY | EM | CRA | CREDIT',
    tags: ['@sanity', '@tnr','@em'],
    amount: 856,
    campaign: "cra",
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-xxx | CEASY | EM | VAC',
    tags: ['@sanity', '@tnr','@em'],
    amount: 4000,
    campaign: "vac",
    assurance: false,
    carte: false
  }
];

const apporteur: CeasyPartner = 'EM';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runCeasyScenario(page, scenario, apporteur);
  });
});


