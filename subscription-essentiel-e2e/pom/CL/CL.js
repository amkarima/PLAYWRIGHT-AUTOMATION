import {CL} from '../../api/CL';

async function generate(page,contrat,partenaire,payload) {
  const data = await CL(payload);
  console.log('lien', data);
  await page.waitForTimeout(3000);
  await page.goto('https://rct.creditpartner.fr/simulateur/?Q6='+partenaire+'&X1='+ contrat+'&token='+data.token, { timeout: 30000 });
}
async function generateNxcb(page,contrat,partenaire,payload) {
  const data = await CL(payload);
  console.log('lien', data);
  await page.waitForTimeout(3000);
  await page.goto('https://rct.splitpayment.creditpartner.fr/?Q6='+partenaire+'&X1='+ contrat+'&token='+data.token, { timeout: 30000 });
}
async function continuerAvecCetteOffre(page) {
 // await page.locator("//button[@class='btn w-70'][1]").nth(1).click()
 await page.getByText("Continuer").nth(0).click()
 //await page.locator("//*[contains(text(),'Je continue avec cette offre')]").nth(0).click()

}
async function je_souscris_a_la_carte(page) {
  await page.click("//button[contains(@class, 'cb--accent')]");
}
//button[@class='btn f-white'][1]
async function setEmailTelAndValidate(page, mail, tel) {
  await page.fill("//input[@id='input-email']", mail)
  await page.locator("//input[@id='input-telephone']").or(page.locator("//input[@id='input-mobileNumber']")).fill(tel)
  await page.click("//button[@type='submit']");
}
 async function setEmailTelAndValidate2(page, mail, tel) {
  await page.fill("//input[@id='input-email']", mail)
  await page.fill("//input[@id='input-mobileNumber']", tel)
  await page.waitForTimeout(2000);
  await page.click("//button[@type='submit']");
}
 async function setEmailTelAndValidateCeasy(page, mail, tel) {
  await page.fill("//input[@id='input-email']", mail)
  //await page.fill("//input[@id='input-telephone']", tel)
  await page.fill("//input[@id='input-telephone']", tel)

  if(page.locator("//input[@id='birthDate']").isVisible()){
    await page.fill("//input[@id='birthDate']", "10/06/1990")

  }
  await page.click("//body")
  await page.click("//button[@type='submit']");

}
async function continuer(page) {
  await page.waitForTimeout(3000)
  await page.locator("//button[@data-testid='continue-button']").click();
}
async function setCard(page, card) {
  await page.waitForTimeout(3000);
  if(!card){
    await page.click("//*[@for='none']");
  }
  await page.click("//button[@type='submit']");
}
module.exports = {
  generate,generateNxcb,continuerAvecCetteOffre,setEmailTelAndValidate,continuer,setCard,je_souscris_a_la_carte,setEmailTelAndValidateCeasy,setEmailTelAndValidate2
};