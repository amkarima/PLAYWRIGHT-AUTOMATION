import { test, expect } from '@playwright/test';

test('Utilisation disponible', async ({ page, context }) => {

  await context.addCookies([{
    name: 'simulationPath',      
    value: 'classic',
    domain: 'rct.mon-espace-client.sofinco.fr',        
    path: '/'
  }]);

  await page.routeFromHAR('./MYSOF/utilisationDispo/mockapi.har', {
    url: '*/**/rct-api.sofinco.fr/*/**/',
    update: true,
  });

  await page.goto('https://SCE_CACF_MYSOFCO:Self$care@25@rct.mon-espace-client.sofinco.fr');
  await page.click('//span[contains(text(),"Accepter")]');
  await page.goto('https://rct.mon-espace-client.sofinco.fr/auth/autologin?uid=91000128435');

  await page.click('//*[contains(text(),"Utiliser mon disponible")]');
  await page.fill("//*[@id = 'requiredamount']", "25");
  await page.click('//*[contains(text(),"Simuler mon remboursement")]');
  await page.click("//*[@for = 'conditionsStandard']");
  await page.click("//span[contains(text(),'Voir le récapitulatif')]");
  await page.click("//*[contains(text(),'Confirmer mon choix')]");
  const confirmation = page.locator("//*[@class = 'transfertValid__title']")
  await expect(confirmation).toHaveText("Votre demande d'utilisation de 25,00 € a bien été prise en compte");
  
});
