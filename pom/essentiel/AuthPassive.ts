import { Page, test } from '@playwright/test';
import { fetchLatestMFA } from '../../api/getMyMFA';

const LOCATORS = {
  buttonParSms: "//*[@class= 'btn w-full']",
  otpCodeInput1: "//*[@id='codeOTPKeypadInput0']",
  otpCodeInput2: "//*[@id='codeOTPKeypadInput1']",
  otpCodeInput3: "//*[@id='codeOTPKeypadInput2']",
  otpCodeInput4: "//*[@id='codeOTPKeypadInput3']",
  otpCodeInput5: "//*[@id='codeOTPKeypadInput4']",
  otpCodeInput6: "//*[@id='codeOTPKeypadInput5']",
  ValiderBoutton: "//*[@aria-label= 'Valider']"
};

export async function setOtpAndValidate(page: Page) {
  await test.step("Etape: Saisie code otp et validation", async () => {
    await page.waitForTimeout(15000);
    const data = await fetchLatestMFA();
    console.log('Données OTP reçues :', data.mfaCode);
    await page.fill(LOCATORS.otpCodeInput1, data.mfaCode.charAt(0));
    await page.fill(LOCATORS.otpCodeInput2, data.mfaCode.charAt(1));
    await page.fill(LOCATORS.otpCodeInput3, data.mfaCode.charAt(2));
    await page.fill(LOCATORS.otpCodeInput4, data.mfaCode.charAt(3));
    await page.fill(LOCATORS.otpCodeInput5, data.mfaCode.charAt(4));
    await page.fill(LOCATORS.otpCodeInput6, data.mfaCode.charAt(5));
    await page.click(LOCATORS.ValiderBoutton)
  });
}

export async function skipPedago(page: Page) {
  await test.step("Etape: Ecran Authentifiez vous", async () => {
    await page.click(LOCATORS.buttonParSms)
  });
}

