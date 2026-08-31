import { test, Page, expect } from '@playwright/test';
import path from 'path'
import { getCalculatorResponse } from '../../utils/Utils';
const LOCATORS = {
  submitButton: "//button[@type='submit']",
  checkboxFrame: "//div[@class='checkbox-frame']"
};

export async function checkRecapitulatifInfos(page: Page) {
  
}

export async function acceptRecapitulatifInfos(page: Page) {
  await test.step("Etape: Recapitulatif informations", async () => {
    await page.waitForTimeout(3000);
    await page.waitForLoadState('load')
    await page.getByText("Votre récapitulatif").click()
    await page.locator("button").filter({hasText:"Confirmer"}).click()
  });  
}

export async function checkRecapitulatifFinancement(page: Page, assurance: boolean) {
  await checkOffreDeFinancement(page);
 // await checkValeursOffre(page,assurance);
  await checkDetailOffre(page,assurance);
  await checkValeursDetailOffre(page,assurance);
  await page.getByTitle("Fermer", { exact: true }).click();
}

export async function checkOffreDeFinancement(page: Page) {
  await expect(page.getByRole('heading', { name: 'Votre offre de financement' }).first()).toBeVisible();
  
  await expect(page.getByText('Montant du crédit').first()).toBeVisible();
  await expect(page.getByText('TAEG révisable').first()).toBeVisible();
  await expect(page.getByText('Montant total dû').first()).toBeVisible();
  await expect(page.getByText("Je certifie sur l’honneur")).toBeVisible();
  await expect(page.getByText('notice de signature électronique').first()).toBeVisible();
}

export async function checkDetailOffre(page: Page, assurance: boolean = false) {
  await page.getByText("Voir le détail").click();

  await expect(page.getByText("Montant du crédit").first()).toBeVisible();
  await expect(page.getByText("Nombre de mensualités").first()).toBeVisible();
  await expect(page.getByText("Première mensualité").first()).toBeVisible();
  await expect(page.getByText("Suivi de 34 mensualités de").first()).toBeVisible();
  await expect(page.getByText("Dernière mensualité ajustée").first()).toBeVisible();
  await expect(page.getByText("Montant total dû").first()).toBeVisible();
  await expect(page.getByText("Hors assurance facultative").first()).toBeVisible();
  await expect(page.getByText("Date de prélèvement").first()).toBeVisible();
  await expect(page.getByText("Frais de dossier").first()).toBeVisible();
  await expect(page.getByText("TAEG révisable par palier").first()).toBeVisible();
  await expect(page.getByText("Taux débiteur révisable par palier").first()).toBeVisible();
  await expect(page.getByText("Carte associée").first()).toBeVisible();
  await expect(page.getByText("Attention ! Un crédit coûte de l'argent et doit être remboursé.")).toBeVisible();
  await expect(page.getByText("Télécharger ma simulation")).toBeVisible();

if (assurance) {
  await expect(page.getByText("TAEA à partir de")).toBeVisible();
  await expect(page.getByText("Coût mensuel de l'assurance")).toBeVisible();
  await expect(page.getByText("Coût total assurance")).toBeVisible();
}
}

export async function checkValeursOffre(page: Page, avecAssurance: boolean) {
  const calculator = getCalculatorResponse(page);
  const proposal = calculator.proposals[0];

  const formatMontant = (value: number) =>
    value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';

  const montant = formatMontant(calculator.amountRequested);

  const totalDu = avecAssurance
    ? formatMontant(proposal.totalDueAmountWithInsurance)
    : formatMontant(proposal.totalDueAmountWithoutInsurance);

  await expect(
    page.getByText(montant, { exact: true }).first(),
    `Montant du crédit incorrect : ${montant} attendu`
  ).toBeVisible();

  await expect(
    page.getByText(totalDu, { exact: true }).first(),
    `Montant total dû incorrect : ${totalDu} attendu`
  ).toBeVisible();
}

export async function checkValeursDetailOffre(page: Page, assurance: boolean = false) {
  const calculator = getCalculatorResponse(page);
  const proposal = calculator.proposals[0];

  const formatMontant = (value: number) =>
    value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';

  const montant = formatMontant(calculator.amountRequested);
  const totalDuHorsAssurance = formatMontant(proposal.totalDueAmountWithoutInsurance);

  await expect(
    page.getByText(montant, { exact: true }).first(),
    `Montant du crédit incorrect dans le détail : ${montant} attendu`
  ).toBeVisible();

  await expect(
    page.getByText(totalDuHorsAssurance, { exact: true }).first(),
    `Montant total dû hors assurance incorrect : ${totalDuHorsAssurance} attendu`
  ).toBeVisible();
}


export async function acceptRecapitulatifFinancement(page: Page) {
  await test.step("Etape: Recapitulatif financement", async () => {
    await page.waitForLoadState('load')
    await page.getByText("Je reconnais avoir").click()

    await page.waitForTimeout(1000);
    await page.locator("button").filter({hasText:"Valider"}).click()
  });  
}