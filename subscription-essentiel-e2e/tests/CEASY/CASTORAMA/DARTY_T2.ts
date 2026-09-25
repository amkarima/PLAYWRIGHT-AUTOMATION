import { test, Page, chromium } from '@playwright/test';
import * as api from '../../../api/Ceasy';
import * as cl from '../../../pom/CL';
import * as simulateur from '../../../pom/simulateur';
import jdd from '../../../datas/jdd/ceasy.json';
import * as essentiel from '../../../pom/essentiel';
import * as utils from '../../../utils/Utils';
import * as steps from '../../../steps/souscriptionSteps';
test.describe.configure({ mode: 'parallel' });

const scenarios = [
 
  {
    title: 'SOF-ddd | CEASY | DARTY | VAC',
    tags: ['@sanity', '@tnr'],
    amount: 2500,
    campaign: "vac",
    assurance: false,
    carte: false
  }
];

const apporteur = "DARTY"

scenarios.forEach(({ title, campaign, amount, assurance, carte, tags }) => {

test(title, { tag: tags }, async ({  page, context, browser  }) => {
     const { data,email, idRecto, idVerso } =await steps.GenenrationDeDonneDeTest(jdd);
     await steps.CommencerLaSouscriptionCeasy(page, campaign, {apporteur,amount});
     
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);


  //const token = await api.getToken()
 // const link = await api.getUrl(token,"simulationId","vac_darty_t2.json", "web_darty", "vac_wis")


 // await page.goto(link)
    await simulateur.acceptPopupCookies(page);
         await cl.setEmailTelAndValidateCeasy(page, email, data.user.phone)
        
 await steps.ValiderLesOptins(page);
  await page.getByText("Inviter").click();
  await page.getByText("Afficher un QR code").click();
  await page.getByText("Afficher le QR code").click();
  await page.click("//*[@id='qrcode']")
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

  const context2 = await browser.newContext();
  const coemprunteurPage = await context2.newPage()
  //  await coemprunteurPage.getByText("Commencer").click();
  await (await coemprunteurPage).goto(clipboardContent)
  await simulateur.acceptPopupCookies(await coemprunteurPage);
  await (await coemprunteurPage).getByText("Commencer").click()
  await (await coemprunteurPage).getByText("Continuer").click()
  await essentiel.skipIntroPid(await coemprunteurPage);
  await essentiel.selectAndUpload((await coemprunteurPage), "CN", idRecto, idVerso);

  await essentiel.skipIntroPid(page);
  await essentiel.selectAndUpload(page, "CN", idRecto, idVerso);

  await essentiel.confirmLieuNaissance(page, data.birthPlace.country, data.birthPlace.city);
  await essentiel.setStatutMarital(page)

  await essentiel.confirmLieuNaissance(await coemprunteurPage, data.birthPlace.country, data.birthPlace.city);

  try {
  //  await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
    await essentiel.setRib(page);
  } 
  catch (error) {
    await page.getByText("Continuer").or(page.getByText("Suivant")).click();;
    await essentiel.connectLinxoAccount(page, data.linxo.account);
    await essentiel.selectFirstAccount(page);
  }

  await essentiel.setCsp(page, data.csp.amount, data.csp.date);
  await essentiel.setCsp(await coemprunteurPage, data.csp.amount, data.csp.date);

  
  await essentiel.setAdresse(page, data.address.street, data.address.zipCode, data.address.loyer, data.address.date, true);

  await essentiel.setAssurance(page, data.assurance.type);
  await essentiel.setAssurance(await coemprunteurPage, data.assurance.type);


  await utils.interceptNumDossier(page)
  await (await coemprunteurPage).getByText("Confirmer").nth(1).click();

  
  await essentiel.acceptRecapitulatifInfos(page);
  await essentiel.acceptRecapitulatifFinancement(page);
  await essentiel.acceptRecapitulatifFinancement(await coemprunteurPage);


  await essentiel.acceptConditons(page, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(page);

  await essentiel.acceptConditons(await coemprunteurPage, "CR", data.simulation.carte);
  await essentiel.setOtpAndValidate(await coemprunteurPage);
});

});

