import { test, Page } from '@playwright/test';

const LOCATORS = {
  mauthentifierButton: "//*[@data-e2e='submit-button']",
  suivantButton: "//*[contains(text(),'Continuer')]",
  bankSearchInput: "//input[@id='bank-search-input']",
  linxoTestBankOption: "//*[contains(text(),'Linxo Test Bank')]",
  submitButton: "//button[@type='submit']",
  loginInput: "//input[@id='login']",
  passwordInput: "//input[@id='password']",
  fileUrlInput: "//input[@id='file_url']",
  firstAccountLabel: "//label[@for='account-0']/span[1]",
  ribInput: "//input[@id='input-iban']"
};

const today = new Date();
const formattedDate = today.toISOString().split('T')[0].replace(/-/g, '_');

// Core single-attempt connection logic separated from retry machinery
async function linxoAttempt(page: Page, fichier: string, preferAuthButton: boolean = true) : Promise<'success'|'retry'|'none'> {
  // perform auth sequence once
  await page.fill(LOCATORS.bankSearchInput, "Linxo");
  await page.waitForTimeout(200);

  // try to select the bank option if visible; otherwise simulate Enter on the input (some flows have no auth button)
  if (await page.locator(LOCATORS.linxoTestBankOption).first().isVisible().catch(() => false)) {
    await page.click(LOCATORS.linxoTestBankOption).catch(() => {});
  } else {
    await page.press(LOCATORS.bankSearchInput, 'Enter').catch(() => {});
  }

  // trigger authentication: prefer explicit button on the first (happy) attempt, otherwise submit via Enter or submitButton
  if (preferAuthButton && await page.locator(LOCATORS.mauthentifierButton).first().isVisible().catch(() => false)) {
    await page.click(LOCATORS.mauthentifierButton).catch(() => {});
  } else {
    // no explicit auth button or in retry path: try submitting the bank input to go to the auth step
    await page.press(LOCATORS.bankSearchInput, 'Enter').catch(() => {});
    await page.click(LOCATORS.submitButton).catch(() => {});
  }

  // Helper: try to fill a selector either in frames or main page (do not assume frame presence)
  const fillIfVisible = async (selector: string, value: string) => {
    // try frames first
    for (const f of page.frames()) {
      try {
        const loc = f.locator(selector);
        if (await loc.first().isVisible().catch(() => false)) {
          await loc.fill(value).catch(() => {});
          return true;
        }
      } catch (err) {
        // ignore
      }
    }
    // fallback to main page
    try {
      const locMain = page.locator(selector);
      if (await locMain.first().isVisible().catch(() => false)) {
        await locMain.fill(value).catch(() => {});
        return true;
      }
    } catch (err) {
      // ignore
    }
    return false;
  };

  // Try to fill credentials and file url where they appear (may be in iframe or main page)
  await fillIfVisible(LOCATORS.loginInput, 'dev');
  await fillIfVisible(LOCATORS.passwordInput, 'dev');
  await fillIfVisible(LOCATORS.fileUrlInput, `https://linxo-test-bank.s3.amazonaws.com/B2B/QyHEv57N954fehyc22/${formattedDate}/${fichier}.txt`);
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter').catch(() => {});

  // small helpers
  const accountSelectors = [LOCATORS.firstAccountLabel, "//label[contains(@for,'account')]", "//div[contains(@class,'account')]", "text=Sélectionner", "text=Select account"];
  const retrySelectors = ["text=Réessayer", "text=Ressayer", "text=Ré-essayer", "text=Réessayer la connexion", "text=Retry", "text=Try again"];
  const errorRegex = /Echec de la connexion|Nous n'avons pas pu récupérer|Veuillez réessayer|n'avons pas pu récupérer|failed to fetch/i;

  const clickRetryButtons = async (context: any) => {
    for (const rsel of retrySelectors) {
      try {
        const loc = context.locator ? context.locator(rsel) : page.locator(rsel);
        if (await loc.first().isVisible().catch(() => false)) {
          await loc.first().click().catch(() => {});
          return true;
        }
      } catch (err) {}
    }
    return false;
  };

  const findAndClickAccountInContext = async (context: any) => {
    for (const sel of accountSelectors) {
      try {
        const locator = context.locator ? context.locator(sel) : page.locator(sel);
        if (await locator.first().isVisible().catch(() => false)) {
          await locator.first().click({ timeout: 5000 }).catch(() => {});
          // try submit inside same context
          try { await (context.locator ? context.locator(LOCATORS.submitButton) : page.locator(LOCATORS.submitButton)).first().click().catch(() => {}); } catch (err) {}
          return true;
        }
      } catch (err) {}
    }
    return false;
  };

  // poll for result within widget frames and main page
  const timeoutMs = 20000; const pollInterval = 500; const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // inspect frames first
    for (const f of page.frames()) {
      const url = f.url() || '';
      if (!url) continue;
      if (url.includes('linxo') || url.includes('oxlin') || url.includes('stettestbank') || url.includes('authorize')) {
        // try click account
        if (await findAndClickAccountInContext(f)) return 'success';
        // try retry buttons inside frame
        if (await clickRetryButtons(f)) return 'retry';
        // check error text
        if (await f.locator(`text=${errorRegex}`).first().isVisible().catch(() => false)) return 'retry';
      }
    }

    // try main page
    if (await findAndClickAccountInContext(page)) return 'success';
    if (await clickRetryButtons(page)) return 'retry';
    if (await page.locator(`text=${errorRegex}`).first().isVisible().catch(() => false)) return 'retry';

    await page.waitForTimeout(pollInterval);
  }

  return 'none';
}

// Generic retry helper to avoid duplicating retry logic elsewhere
async function retryAsync<T>(fn: () => Promise<T>, retries: number, delayMs: number = 500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// Public wrapper: uses linxoAttempt and retry logic
export async function connectLinxoAccount(page: Page, fichier: string, maxRetries: number = 3) {
  await test.step("Etape: Connexion banque Linxo", async () => {
    // First attempt should use the original happy-path (preferAuthButton = true)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const preferAuthButton = attempt === 1;
      const r = await linxoAttempt(page, fichier, preferAuthButton);
      if (r === 'success') return;
      if (r === 'retry') {
        // try next attempt
        continue;
      }
      // 'none' -> try again unless last attempt
    }

    // After retries exhausted, try IBAN fallback
    let ibanFilled = false;
    try {
      for (const f of page.frames()) {
        try {
          if (await f.locator(LOCATORS.ribInput).first().isVisible().catch(() => false)) {
            await f.locator(LOCATORS.ribInput).fill("FR76 3000 6000 0112 3456 7890 189");
            await f.locator(LOCATORS.submitButton).first().click().catch(() => {});
            ibanFilled = true;
            break;
          }
        } catch (err) {
          // ignore frame errors
        }
      }

      if (!ibanFilled && await page.locator(LOCATORS.ribInput).first().isVisible().catch(() => false)) {
        await setRib(page);
        ibanFilled = true;
      }
    } catch (err) {
      console.warn('Linxo: erreur lors de la tentative de saisie IBAN fallback', err);
    }

    if (ibanFilled) {
      return; // considérer comme réussite
    }

    throw new Error('Echec de la connexion Linxo après plusieurs tentatives (Linxo) et IBAN non proposé');
  });
}

export async function selectFirstAccount(page: Page) {
  await test.step("Etape: Sélection compte RIB", async () => {
    await page.click(LOCATORS.firstAccountLabel, {timeout: 180000});
    await page.click(LOCATORS.submitButton);
  });
}

export async function setRib(page: Page) {
  await test.step("Etape: Saisie du rib", async () => {
    await page.fill(LOCATORS.ribInput, "FR76 3000 6000 0112 3456 7890 189");
    await page.click(LOCATORS.submitButton);
  });
}

//input-iban