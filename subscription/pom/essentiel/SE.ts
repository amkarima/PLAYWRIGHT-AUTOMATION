import { Page, test } from '@playwright/test';
import { fetchLatestMFA } from '../../api/getMyMFA';

const LOCATORS = {
  otpCodeInput: "//input[@id='psm_otp_code']",
  signButton: "//button[@id='signBtn']",
  signButtonCeasy: "//button[@class='btn btn-otp']"
};

export async function acceptConditons(page: Page, contrat: string, carte: string) {
  await test.step('Etape: SE - Accepter les conditions', async () => {
    try {
      await page.click(`//label[@for="custom_cb-0"]`, { timeout: 90000 });
      await page.click(`//label[@for="custom_cb-1"]`, { timeout: 90000 });
      await page.click(`//label[@for="custom_cb-3"]`, { timeout: 90000 });
    } catch (error) {
      
    }
      if (carte == "oui") {
        try {
          await page.click(`//label[@for="custom_cb-2"]`, { timeout: 10000 });

        } catch (error) {
          
        }
      }
  });
}

export async function setOtpAndValidate(page: Page) {
  if(process.env.se == "oui"){
    await test.step("Etape: Saisie code otp et validation", async () => {
      await page.waitForTimeout(15000);
      await page.fill(LOCATORS.otpCodeInput, "0000");
      const data = await fetchLatestMFA();
      console.log('Données OTP reçues :', data.mfaCode);
      await page.fill(LOCATORS.otpCodeInput, data.mfaCode);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await page.click(LOCATORS.signButton);
      await page.waitForTimeout(30000);
    });
  }
  else{

  }

}

  export async function acceptConditonsSeCeasy(page: Page) {
    await test.step('Etape: SE - Ceasy - Accepter les conditions', async () => {
     // if(process.env.se == "oui"){
     try {
      await page.click(`//label[@for="checkbox1"]`, { timeout: 60000 });
      await page.click(`//label[@for="checkbox2"]`, { timeout: 60000 });
      await page.click(`//label[@for="checkbox4"]`, { timeout: 60000 });   
     } catch (error) {
      
     }
     
     // }
    });
  }
    export async function setOtpAndValidateCeasy(page: Page) {
      if(process.env.se == "oui"){
      await test.step("Etape: Saisie code otp et validation", async () => {
        await page.waitForTimeout(15000);
        const data = await fetchLatestMFA();
        console.log('Données OTP reçues :', data.mfaCode);
        await page.fill(LOCATORS.otpCodeInput, data.mfaCode);
        await page.keyboard.press('Enter');
        await page.keyboard.press('Tab');
        await page.click(LOCATORS.signButtonCeasy);
      });
    }
}