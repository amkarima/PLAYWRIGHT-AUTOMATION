import { request } from '@playwright/test';
import * as fs from 'fs';


/**
 * Fonction statique pour appeler l'API.
 * @returns {Promise<Object>} La réponse JSON de l'API.
 */
export async function CL(payload): Promise<object> {
  const apiUrl = 'https://rct-creditpartner.ca-cf.gca/creditlauncher/data-transfert';

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await request.newContext(
      {
        ignoreHTTPSErrors: true,
      }
    );

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: fs.readFileSync("datas/CL/" + payload, 'utf-8').replaceAll("{{orderId}}", (""+Date.now()).substring(4,9)),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}

module.exports = {
  CL,
};

