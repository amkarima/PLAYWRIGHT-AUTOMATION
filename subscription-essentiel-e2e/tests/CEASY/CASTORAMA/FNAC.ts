import { test } from '@playwright/test';
import { runCeasyScenario } from '../../../helpers/ceasyRunner';
import { CeasyPartner } from '../../../config/partners';
test.describe.configure({ mode: 'parallel' });

const scenarios = [
  {
    title: 'SOF-150935 | CEASY | FNAC | CRA | CREDIT',
    tags: ['@sanity', '@tnr', '@fnac'],
    amount: 600,
    campaign: 'cra',
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-150935 | CEASY | FNAC | CRA | COMPTANT',
    tags: ['@sanity', '@tnr', '@fnac'],
    amount: 600,
    campaign: 'cra',
    comptant: true,
    assurance: false,
    carte: true
  },
  {
    title: 'SOF-150946 | CEASY | FNAC | VAC',
    tags: ['@sanity', '@tnr', '@fnac'],
    amount: 3000,
    campaign: 'vac',
    assurance: false,
    carte: false
  },
  {
    title: 'SOF-150946 | CEASY | FNAC | CRS',
    tags: ['@sanity', '@tnr', '@fnac'],
    amount: 700,
    campaign: 'crs',
    assurance: false,
    carte: false
  }
];

const apporteur: CeasyPartner = 'FNAC';

scenarios.forEach((scenario) => {
  test(scenario.title, { tag: scenario.tags }, async ({ page }) => {
    await runCeasyScenario(page, scenario, apporteur);
  });
});