import { test } from '@playwright/test';
import * as essentiel from '../pom/essentiel';

test('RECORD TEST MANUEL', async ({ page}) => {
  await page.goto(`${essentiel.env}/parcours-simulateur`)
  await page.waitForTimeout(60000)
});
