import fs from 'fs';

async function sendToSlack(message, data) {
  try {
    fetch('https://hooks.slack.com/services/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', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Résultat des tests automatisés:\n*<fakeLink.toEmployeeProfile.com|Execution Vision>*"
            }
          },
          {
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "*Test:*\n "+data.test
              },
              {
                "type": "mrkdwn",
                "text": "*Partenaire:*\n"+data.partenaire
              },
              {
                "type": "mrkdwn",
                "text": "*Assurance:*\nOui"
              },
              {
                "type": "mrkdwn",
                "text": "*Carte:*\nNon"
              },
              {
                "type": "mrkdwn",
                "text": "*N° de dossier:*\n"+data.dossier
              },
              {
                "type": "mrkdwn",
                "text": "*Numéro Client:*\n"+data.client
              }
            ]
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Signer le dossier"
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Click Me",
                "emoji": true
              },
              "value": "click_me_123",
              "url": "https://google.com",
              "action_id": "button-action"
            }
          }
        ]
      }
    });
  } catch (error) {
    
  }

}
async function generateRandomEmail() {
  const timestamp = Date.now(); // Timestamp en millisecondes depuis l'époque Unix
  return "testauto" + timestamp + "@sofinco.fr"
}

async function generateRandomBirthDate() {
  const timestamp = Date.now(); // Timestamp en millisecondes depuis l'époque Unix
  return ((Math.random() * 20) +10) + "/0" + (Math.random()* 9) + "/"+ (1900 + (Math.random()*107))
}

async function launchBrowser(chromium, url, testTitle) {
  const browser = await chromium.launch({
    headless: false,
    arguments: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 428, height: 928 },
    isMobile: true,



    //recordVideo: {dir: "./video/"+testTitle},

  });
  const page = await context.newPage();
  await page.goto(url);
  return page;
}

async function interceptNumDossier(page) {
  var numDossier = "?"
  await page.route('**/subscribe', route => {
    if (numDossier == "?") {
      const url = `${route.request().url()}`;
      const urlSplit = url.split('/');
      const dossier = urlSplit[urlSplit.length - 4];
      const client = urlSplit[urlSplit.length - 2];

      numDossier = dossier
      Dossier.dossier = numDossier
      Dossier.client = client
      const line = process.env.CI_JOB_NAME + `: Id dossier: ${numDossier} / Id client: ${client}\n`;

      // Écrire ou ajouter au fichier
      fs.appendFile('./dossiers/'+process.env.CI_JOB_NAME+'.txt', line, (err) => {
        if (err) {
          console.error("Erreur lors de l'écriture du fichier:", err);
        } else {
          console.log(`Id dossier: ${numDossier} Id client: ${client}\n`);

        }
      });
    }
    route.continue(); // Allow the request to proceed

  });

}
export class Dossier {
  static dossier = "?";
  static client = "?";

   static sendDossierToSlack() {
    const line = process.env.CI_JOB_NAME + `: Id dossier: ${this.dossier} / Id client: ${this.client}\n`;

    fetch('https://hooks.slack.com/services/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', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        'text': line
      })
    });
  }

}
module.exports = {
  generateRandomEmail, launchBrowser, interceptNumDossier, Dossier, sendToSlack
};
