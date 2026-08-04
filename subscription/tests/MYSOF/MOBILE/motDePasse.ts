import { test } from '@playwright/test';
import { fetchLatestMFA } from '../../../api/getMyMFA';

test('Résiliation assurance', async ({ page, context }) => {

  await context.addCookies([{
    name: 'simulationPath',      
    value: 'classic',
    domain: 'rct.mon-espace-client.sofinco.fr',        
    path: '/'
  }]);

  await page.goto('https://SCE_CACF_MYSOFCO:MySof&CoA21!@rct.mon-espace-client.sofinco.fr');
  await page.click('//span[contains(text(),"Accepter")]');
  await page.click('//*[@class = "popup__closeBtn--mobile"]');
  await page.fill("//input[contains(@aria-label, 'mail')]", "0757592589");
  await page.click('//*[contains(text(),"Continuer")]');
  await page.fill("//input[@aria-label='Votre date de naissance']", "01/06/1968");
  await page.fill("//input[@aria-label='Votre département de naissance']", "62");
  await page.click('//*[contains(text(),"Continuer")]');
  await page.click('//*[@aria-label = "Choix envoi OTP par mobile"]');
  await page.waitForTimeout(5000);
  const data = await fetchLatestMFA();
  console.log('Données reçues :', data.mfaCode);
  
  await page.fill("//input[@id='otpDigit0']",data.mfaCode.charAt(0));
  await page.fill("//input[@id='otpDigit1']",data.mfaCode.charAt(1));
  await page.fill("//input[@id='otpDigit2']",data.mfaCode.charAt(2));
  await page.fill("//input[@id='otpDigit3']",data.mfaCode.charAt(3));
  await page.fill("//input[@id='otpDigit4']",data.mfaCode.charAt(4));
  await page.fill("//input[@id='otpDigit5']",data.mfaCode.charAt(5));
});
