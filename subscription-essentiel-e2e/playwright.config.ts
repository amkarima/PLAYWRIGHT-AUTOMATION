import { defineConfig, devices } from '@playwright/test';

const serverProxy = process.env.SERVER_PROXY
const usernameProxy = process.env.USERNAME_PROXY
const passwordProxy = process.env.PASSWORD_PROXY

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.ts',
  retries: 1,
 // testMatch: '**/MYSOF/MOBILE/U*.ts',
 use: {
  /*proxy: {
    server: serverProxy,
    username: usernameProxy,
    password: passwordProxy
  },*/
  video: 'on-first-retry',
  headless:true,
  trace: 'retain-on-first-failure',
  actionTimeout: 60000,
  ignoreHTTPSErrors: true,
  launchOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  }
  },
  /* Maximum time one test can run for. */
  timeout: 600000,
  expect: {
  timeout: 60000,
  },
  /* tests in parallel */
  workers: 5,
  reporter: [['blob'],['html'],['line'],['json', {  outputFile: 'test-results.json' }]],
  projects: [

    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
   /* {
      name: 'Tablette',
      use: { ...devices['Galaxy Tab S4'] },
    }*/
  ]
});