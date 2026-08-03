import { XrayConfig, XrayTest } from '../types';

class XrayAPI {
  private _config: XrayConfig = {
    url: 'https://gitlab.steelhome.internal',
    type: 'server',
    apiVersion: '1.0',
    token: 'xxx'
  };

  get config(): XrayConfig {
    return this._config;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this._config) {
      throw new Error('Configuration Xray manquante. Veuillez configurer Xray dans les paramètres.');
    }

    try {
      const url = `/api/xray${endpoint}`;
      console.log('Making request to:', url);
      console.log('With headers:', {
        'x-xray-target-url': this.config.url,
        'x-xray-auth': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
      });
      
      const response = await fetch(url, {
        headers: {
          'x-xray-target-url': this.config.url,
          'x-xray-config': JSON.stringify(this.config),
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Xray API error: ${response.status} ${response.statusText}`);
      }

      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText.substring(0, 200) + '...');
        return JSON.parse(responseText);
      } catch (jsonError) {
        if (jsonError instanceof SyntaxError) {
          throw new Error('Réponse non-JSON reçue de Xray. Vérifiez que le token d\'authentification est valide et que l\'URL Jira est correcte.');
        }
        throw jsonError;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Impossible de se connecter à Xray. Vérifiez que l\'URL Jira est correcte et accessible.');
      }
      throw error;
    }
  }

  async getTestsFromTestExecution(testExecutionKey: string): Promise<XrayTest[]> {
    try {
      // Use correct testplan endpoint for Xray Server/DC API v1.0
      const response = await this.makeRequest<XrayTest[]>(`/rest/raven/1.0/api/testplan/${testExecutionKey}/test`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching tests from Xray:', error);
      throw new Error(`Impossible de récupérer les tests du Test Plan ${testExecutionKey}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async validateTestExecution(testExecutionKey: string): Promise<boolean> {
    try {
      await this.getTestsFromTestExecution(testExecutionKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTestsFromTestPlan(testPlanKey: string): Promise<XrayTest[]> {
    return this.getTestsFromTestExecution(testPlanKey);
  }

  async getTestsFromTestPlan2(testPlanKey: string = 'MTQAXRAY-1'): Promise<XrayTest[]> {
    try {
      // Use the same endpoint as your script
      const response = await this.makeRequest<XrayTest[]>(`/rest/raven/1.0/api/testplan/${testPlanKey}/test`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching tests from Xray testplan:', error);
      throw new Error(`Impossible de récupérer les tests du Test Plan ${testPlanKey}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
}

export const xrayApi = new XrayAPI();