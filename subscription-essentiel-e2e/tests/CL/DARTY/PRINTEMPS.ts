import { test } from '@playwright/test';
import { runFullWebClScenario } from '../../../helpers/fullWebClRunner';
import { FullWebClPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });

const scenarios = [
  {
    title: 'SOF-150935 | CEASY | PRINTEMPS | CRS | CREDIT',
    tags: ['@refacto', '@tnr', '@printemps'],
    amount: 700,
    campaign: "crs",
    assurance: false,
    carte: true
  }
];



const apporteur: FullWebClPartner = 'PRINTEMPS';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runFullWebClScenario(page, scenario, apporteur);
  });
});
