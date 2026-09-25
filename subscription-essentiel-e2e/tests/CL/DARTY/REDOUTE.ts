import { test } from '@playwright/test';
import { runFullWebClScenario } from '../../../helpers/fullWebClRunner';
import { FullWebClPartner } from '../../../config/partners';

test.describe.configure({ mode: 'parallel' });

const scenarios = [
  {
    title: 'SOF-150935 | CEASY | REDOUTE | CRS | CREDIT',
    tags: ['@refacto', '@tnr', '@redoute'],
    amount: 700,
    campaign: "crs",
    assurance: false,
    carte: true
  }
];



const apporteur: FullWebClPartner = 'REDOUTE';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runFullWebClScenario(page, scenario, apporteur);
  });
});
