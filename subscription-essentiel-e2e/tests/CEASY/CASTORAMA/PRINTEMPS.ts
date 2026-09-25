import { test } from '@playwright/test';
import { runCeasyScenario } from '../../../helpers/ceasyRunner';
import { CeasyPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });

const scenarios = [
  {
    title: 'SOF-151325 | CEASY | PRINTEMPS | CRA | CREDIT',
    tags: ['@sanity', '@tnr', '@printemps'],
    amount: 2560,
    campaign: "cra",
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-XXXX | CEASY | PRINTEMPS | VAC',
    tags: ['@sanity', '@tnr', '@printemps'],
    amount: 4000,
    campaign: "vac",
    assurance: false,
    carte: false
  }
];

const apporteur: CeasyPartner = 'PRINTEMPS';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runCeasyScenario(page, scenario, apporteur);
  });
});



