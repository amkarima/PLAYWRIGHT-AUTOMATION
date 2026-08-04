/**
 * @fileoverview Custom Playwright reporter to export test results as a JSON payload
 * and send it to an API endpoint.
 *
 * To use this reporter, add it to your playwright.config.js file:
 * //keep order automeScore mandatory first
 * /**
 * Automate Score variables - Start
 * const apiURL = 'https://qifvegchizwgznyekpbm.supabase.co/functions/v1/playwright-data-ingestion';
 * const APIKey = process.env.PLAYWRIGHT_API_KEY ?? APIKeyLocal;
 * const secretKey = process.env.PLAYWRIGHT_SECRET_KEY ?? secretKeyLocal;
 * const systemName =  process.env.SYSTEMNAME ?? systemNameLocal;
 * const campaignName = process.env.CAMPAIGNNAME ?? campaignNameLocal ;
 *
* const testEnv = process.env.TEST_ENVIRONMENT || 'unknown';
*
* Automate Score variables - End
* 
 * 
 * reporter: [
 * *  
 *   
 *    //* automate Score mandatory - Start
 *    
 *   ['json', {  outputFile: 'test-results.json' }], 
 *   ['./playwright-json-reporter.cjs', {
 *     apiUrl: apiURL,      
 *     apiKey: APIKey,
 *     secretKey: secretKey,
 *     systemName: systemName,
 *     campaignName: campaignName,
 *     testEnv: testEnv,
 *     sendFullResults: true // Set to false to send only mandatory 'execution' data
 *     }
 *   ],
 *    
 *    // * automate Score mandatory - End
 *    // ['line'], // Optional, for console output
 *   // ['html'],
 * ]
 *
 * Make sure to set your API keys as environment variables in your CI/CD pipeline.
 */

const { Reporter } = require('@playwright/test/reporter');
const fs = require('fs');
const path = require('path');

class JsonReporter {
  constructor(options) {
    this.options = options;
    this.execution_status = '' // voir pour sortir un script d'envoi du status a part pour eviter le soucis d'interruption de l'exec et donc pas de rporter
    this.ci_build_id = process.env.CI_JOB_ID || 'Local' 
    this.commit_sha = process.env.CI_COMMIT_SHA || 'Local'
    this.branch = process.env.CI_COMMIT_BRANCH || 'Local',
    this.trigger = process.env.CI_PIPELINE_SOURCE || 'Local'
    this.ci_platform = process.env.CI_SERVER_NAME || 'Local'
    this.payloadToSend = process.env.PAYLOADTOSEND || 'true';
    this.integration_id = "d723fa53-0566-4adb-8c18-d54fda423b9c";
    this.workspace_id = "b1f0aa22-0b3b-4935-a924-f6886c03c00c";
  }

  onBegin(config, suite) {
    this.suite = suite;
    this.startTime = Date.now();
    this.rootSuite = suite;
    
  }

  onEnd(result) {
    const {
      apiUrl,
      apiKey ,
      secretKey ,
      integration_id = this.integration_id, //demander si constant ou changeant en fonction de l'integration et ou le recuperer
      workspace_id = this.workspace_id, //demander si constant ou changeant en fonction de l'integration et ou le recuperer
      systemName,
      campaignName,
      testEnv,
      sendFullResults = true, 
      testValue           
    } = this.options;
    this.endTime = Date.now();
    const execution_id = (process.env.CI_PIPELINE_ID && process.env.CI_JOB_ID)
      ? `${process.env.CI_PIPELINE_ID}-${process.env.CI_JOB_ID}`
      : "Local-" + new Date(this.endTime).toISOString();

    if (!this.suite) {
      console.error('JsonReporter: Suite information not available. Was onBegin called?');
      return;
    }
    const allTests = this.suite.allTests();
    console.log(`JsonReporter: Run finished. Processing ${allTests.length} tests.`);
    if (!apiUrl || !apiKey || !secretKey || !systemName || !campaignName) {
      console.error('JsonReporter: Missing required configuration options (apiUrl, apiKey, secretKey, systemName, campaignName). Skipping API call.');
      return;
    }

    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    allTests.forEach(test => {
        switch (test.outcome()) {
            case 'expected':
            case 'flaky': // A flaky test has passed after retries
                passedCount++;
                break;
            case 'unexpected':
                failedCount++;
                break;
            case 'skipped':
                skippedCount++;
                break;
        }
    });

    const payload = {      
      api_key: apiKey,    
      integration_id: integration_id,
      execution_id: execution_id,
      workspace_id: workspace_id,
      system_name: systemName,
      campaign_name: campaignName,
      test_suite: campaignName,
      environment: testEnv,
      execution_start: new Date(this.startTime).toISOString(),// recup dans le resultjson ?
      execution_end: new Date(this.endTime).toISOString(),
      total_tests: allTests.length, 
      passed_tests: passedCount, 
      failed_tests: failedCount, 
      skipped_tests: skippedCount,
      execution_status: failedCount > 0 ? 'failed' : 'completed', 
      metadata: {
        ci_build_id: this.ci_build_id,
        commit_sha: this.commit_sha,
        branch: this.branch,
        trigger: this.trigger,
        ci_platform: this.ci_platform,        
      }
    };
  
    //envoi les details de tous les cas de tests, sinon uniquement les infos globales de l'execution
    if (sendFullResults) {
      const results = this.extractTestResults(this.suite);
      payload.test_results = results;
    }
    
    // Store the payload and apiUrl for onExit
    this.finalPayload = payload;
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async onExit() {
    if (this.finalPayload && this.apiUrl) {
      fs.writeFileSync('playwright-payload.json', JSON.stringify(this.finalPayload, null, 2));
      console.log('Le payload final a été sauvegardé dans le fichier playwright-payload.json');
      console.log("debug -->"+this.payloadToSend)
      if (this.payloadToSend){
        // console.log("Payload a envoyer: ",this.apiKey)
        await this.sendPayload(this.apiUrl, this.finalPayload, this.apiKey).then(() =>
          console.log("Payload envoyé")
        );
      }else {
        console.log("Payload non envoyé");
      }
    } else {
      console.error("pas de bras, pas de chocolat !!");
    }
  }
  
  extractTestResults(suite) {
    const results = [];
    suite.allTests().forEach(test => {
      test.results.forEach(testResult => {
        results.push({
          test_file: test.location.file,
          status: testResult.status,
          duration_ms: testResult.duration,
          retry_count: testResult.retry,
          error: testResult.error ? testResult.error.message : undefined,
          failure_reason: testResult.annotations?.find(a => a.type === 'failureReason')?.description        });
      });
    });
    return results;
  }

  async sendPayload(apiUrl, payload, apiKey) {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(payload),
          
        });

        if (response.ok) {
          console.log('JsonReporter: Test run data successfully sent to API.');
          break; // Exit the loop on success
        } else {
          console.error(`JsonReporter: API call failed with status ${response.status}: ${await response.text()}`);
          break; // Exit the loop on non-retryable error
        }
      } catch (error) {
        if (error.name === 'AbortError' || attempts >= maxAttempts - 1) {
          console.error('JsonReporter: Failed to send test run data after multiple retries.', error);
          break;
        }
        
        attempts++;
        const backoffTime = Math.pow(2, attempts) * 1000;
        console.warn(`JsonReporter: API call failed. Retrying in ${backoffTime / 1000} seconds... (Attempt ${attempts} of ${maxAttempts})`);
        await new Promise(res => setTimeout(res, backoffTime));
      }
    }
  }
}

module.exports = JsonReporter;