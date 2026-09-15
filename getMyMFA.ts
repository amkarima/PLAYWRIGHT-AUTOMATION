import { execSync } from 'child_process';

const PHONE_ID = 'phone_01jzw2mmerjhrbx8sq1tk7r4q1';
const API_KEY = 'OfgH9028Ji4EBstI66GQQ3n0rczFeTWj8C4q1XHV';

/**
* Fonction statique pour appeler l'API GETMYMFA.
* @returns {Promise<Object>} La réponse JSON de l'API.
*/
export async function fetchLatestMFA(): Promise<any> {
  const curlCommandWithProxy = `curl -x VIP2-PROXY.CACF.GCA:8080 -U R15449:Mozar59100!!!!!!!! https://programmatic-api.client.get.mymfa.io/v1/${PHONE_ID}/mfa/latest -H "x-api-key: ${API_KEY}" --proxy-ntlm`;
  const curlCommandWithoutProxy = `curl https://programmatic-api.client.get.mymfa.io/v1/${PHONE_ID}/mfa/latest -H "x-api-key: ${API_KEY}"`;

  try {
    const response = execSync(curlCommandWithoutProxy, { encoding: 'utf-8' });
    console.log('Réponse CURL :', response);
    return JSON.parse(response);
  }
  catch (error) {
    console.error('Erreur lors de l\'exécution de la commande CURL sans proxy, tentative avec proxy.. :', error);
    try {
      const response = execSync(curlCommandWithProxy, { encoding: 'utf-8' });
      console.log('Réponse CURL :', response);
      return JSON.parse(response);
    }
    catch (proxyError) {
      console.error('Erreur lors de l\'exécution de la commande CURL avec proxy :', proxyError);
      throw new Error('Failed to fetch the latest MFA');
    }
  }
}