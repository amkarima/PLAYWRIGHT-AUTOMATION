import { test } from '@playwright/test';
import { runCeasyScenario } from '../../../helpers/ceasyRunner';
import { CeasyPartner } from '../../../config/partners';
test.describe.configure({ mode: 'parallel' });


const scenarios = [
  {
    title: 'SOF-150939 | CEASY | DARTY | CRA ',
    tags: ['@sanity', '@tnr','@darty'],
    amount: 600,
    campaign: "cr_essentiel",
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-150945 | CEASY | DARTY | VAC',
    tags: ['@sanity', '@tnr','@darty'],
    amount: 700,
    campaign: "vac",
    assurance: false,
    carte: false
  }
];


const apporteur: CeasyPartner = 'DARTY';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runCeasyScenario(page, scenario, apporteur);
  });
});


