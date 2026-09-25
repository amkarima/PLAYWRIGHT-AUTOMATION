import { test } from '@playwright/test';
import { runCeasyScenario } from '../../../helpers/ceasyRunner';
import { CeasyPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });


const scenarios = [
  {
    title: 'SOF-157989 | CEASY | IKEA | CRA | CREDIT',
    tags: ['@sanity', '@tnr', '@ikea'],
    amount: 1223,
    campaign: "cra",
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-157991 | CEASY | IKEA | VAC',
    tags: ['@sanity', '@tnr', '@ikea'],
    amount: 4000,
    campaign: "vac",
    assurance: false,
    carte: false
  }
];

const apporteur: CeasyPartner = 'IKEA';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runCeasyScenario(page, scenario, apporteur);
  });
});



