import { test } from '@playwright/test';
import { runFullWebClScenario } from '../../../helpers/fullWebClRunner';
import { FullWebClPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });

const scenarios = [
  {
    title: 'SOF-150935 | CEASY | FNAC | CRS | CREDIT',
    tags: ['@refacto', '@tnr', '@fnac'],
    amount: 700,
    campaign: "crs",
    assurance: false,
    carte: true
  }
];



const apporteur: FullWebClPartner = 'FNAC';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runFullWebClScenario(page, scenario, apporteur);
  });
});
