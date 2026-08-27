import { request } from '@playwright/test';
import * as fs from 'fs';

/**
 * Fonction statique pour appeler l'API.
 * @returns {Promise<Object>} La réponse JSON de l'API.
 */

const withProxy = {
  server: "VIP2-PROXY.CACF.GCA:8080"
};

export async function createApiContext() {

  const proxy = process.env.SERVER_PROXY
    ? {
        server: process.env.SERVER_PROXY,
        username: process.env.USERNAME_PROXY,
        password: process.env.PASSWORD_PROXY
      }
    : withProxy;

  return request.newContext({
    ignoreHTTPSErrors: true,
    timeout: 20000,
    proxy
  });
}

export async function getToken() {
  const apiUrl = 'https://rct-api.sofinco.fr/token';

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic TTNQYWdEUGxxaXFNNHNZbV82aGVMSjBlUEdzYTpMU21tSWRqZjdMY0tSU044bElySFIyMWhjNW9h',
      },
      form: {
        'grant_type': 'client_credentials'
      },
      
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}

export async function getTokenCl() {
  const apiUrl = 'https://rct-api.sofinco.fr/token';

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic OHVGOGl0RHdoUHducURqVnpUakd4RWpBVkN3YToyRE9zcDgwN1VhZWZpOVdZd3B3MGlHXzR1SHdh',
      },
      form: {
        'grant_type': 'client_credentials'
      },
      
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}

export async function getSimulationVac(file, partner, token) {
  const apiUrl = `https://rct-api.sofinco.fr/creditSaleSimulation/v1/partners/${partner}/campaigns/vac/simulations/creditSales/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}

export async function getSimulationCra(file, partner, token) {
  const apiUrl = `https://rct-gw-intranet-api.ca-cf.gca/revolvingSimulation/v3/partners/${partner}/campaigns/cr_essentiel/simulations/revolvings/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'ceasy',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getSimulationCraIkea(file, partner, token) {
  const apiUrl = `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/web_ikea/campaigns/cra/simulations/revolvings/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getSimulationVacIkea(file, partner, token) {
  const apiUrl = `https://rct-api.sofinco.fr/creditSaleSimulation/v1/partners/web_ikea/campaigns/vac/simulations/creditSales/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getSimulationCraCastorama(file, token) {
  const apiUrl = `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/web_castorama/campaigns/cra/simulations/revolvings/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getSimulationCraPrintemps(file, token) {
  const apiUrl = `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/web_printemps/campaigns/cra/simulations/revolvings/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getSimulationCrs(file, token) {
  const apiUrl = 'https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/web_fnac/campaigns/crs/simulations/revolvings/calculate';

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'essential',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getSimulationRedoute(file, partner, token) {
  const apiUrl = `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/${partner}/campaigns/cra/simulations/revolvings/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}

export async function getUrl(token, simualtionId, file , partenaire, contrat) {
  const apiUrl = 'https://rct-api.sofinco.fr/partnerDataExchange/v1/links/';
  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()
    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'ceasy',
        'Context-Partnerid': partenaire,
        'Context-Sourceid': contrat,
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8').replace("{{simulationId}}",simualtionId).replaceAll("{{orderId}}", "testauto" + Math.floor(Math.random() * 30000))
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.link;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}

export async function getUrlCeasy(
  token: string,
  simulationId: string,
  contextPayload: any,
  partenaire: string,
  contrat: string
) {
  const apiUrl =
    "https://rct-api.sofinco.fr/partnerDataExchange/v1/links/";

  const context = await createApiContext();

  try {
    const response = await context.post(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Context-Applicationid": "ceasy",
        "Context-Partnerid": partenaire,
        "Context-Sourceid": contrat,
        Authorization: `Bearer ${token}`,
      },
      data: {
        ...contextPayload,
        businessContext: contextPayload.businessContext
          .replaceAll("{{simulationId}}", simulationId)
          .replaceAll(
            "{{orderId}}",
            "testauto" + Math.floor(Math.random() * 30000)
          ),
      },
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      console.log(errorBody);

      throw new Error(
        `HTTP error ${response.status()}`
      );
    }

    const data = await response.json();

    return data.link;
  } finally {
    await context.dispose();
  }
}

export async function getSimulationCraEm(file, partner, token) {
  const apiUrl = `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/web_em/campaigns/cra/simulations/revolvings/calculate`;

  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()

    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8'),
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.id;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }
}
export async function getUrlCl(token, simualtionId, file , partenaire, contrat) {
  const apiUrl = 'https://rct-api.sofinco.fr/partnerDataExchange/v1/links/';
  try {
    // Crée un contexte de requête (pas besoin de navigateur ici)
    const context = await createApiContext()
    const response = await context.post(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Context-Applicationid': 'creditPartner',
        'Context-Partnerid': partenaire,
        'Context-Sourceid': contrat,
        'Authorization': 'Bearer '+token

      },
      data: fs.readFileSync("datas/ceasy/" + file, 'utf-8').replace("{{simulationId}}",simualtionId).replaceAll("{{orderId}}", "TestAuto" + Math.floor(Math.random() * 30000000))
    });

    if (!response.ok()) {
      const data = await response.text();
      await console.log(data)
      throw new Error(`HTTP error! Status: ${response.status()}`);
    }

    const data = await response.json();
    await context.dispose(); // Nettoie le contexte après utilisation
    return data.link;
  } catch (error) {
    console.error('Erreur lors de l\'appel API:', error);
    throw error; // Relance l'erreur pour que les tests puissent la capturer
  }  
}



