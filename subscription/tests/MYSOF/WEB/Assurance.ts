import { test, expect } from '@playwright/test';


test('Résiliation assurance', async ({ page, context }) => {

  await context.addCookies([{
    name: 'simulationPath',
    value: 'classic',
    domain: 'rct.mon-espace-client.sofinco.fr',
    path: '/'
  }]);

  await page.goto('https://SCE_CACF_MYSOFCO:MySof&CoA21!@rct.mon-espace-client.sofinco.fr');

  await page.click('//span[contains(text(),"Accepter")]');

  await page.goto('https://rct.mon-espace-client.sofinco.fr/auth/autologin?uid=92987941558');

  await page.reload()

  await page.click('//*[contains(text(),"Gérer mes dépenses")]');

  await page.click('//*[contains(text(),"Gérer mon assurance")]');

  await page.click('//*[contains(text(),"Déclarer un sinistre")]');

  const confirmationTitre = page.locator("//*[@class = 'popupV2__title popupV2__title--noTopImg']");
  await expect(confirmationTitre).toHaveText("Déclarer un sinistre");

  const confirmationTexte = page.locator("//*[@class = 'popupManageDisaster__text']");
  await expect(confirmationTexte).toHaveText("Vous souhaitez gérer ou déclarer un sinistre rapidement, merci de nous contacter par téléphone au :");
});
