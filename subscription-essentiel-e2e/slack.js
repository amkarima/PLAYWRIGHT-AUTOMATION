// Importation des modules nécessaires
const fs = require('fs');
const fetch = require('node-fetch'); // npm install node-fetch si besoin

// 🔧 Chemin du fichier à lire
const filePath = './dossiers.txt';

// 🔗 Webhook Slack
const webhookURL = 'https://hooks.slack.com/services/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';

// 🧩 Lecture du fichier puis envoi à Slack
fs.readFile(filePath, 'utf8', (err, data) => {
if (err) {
console.error('Erreur de lecture du fichier:', err);
return;
}

// Construction du message à envoyer sur Slack
const message = {
text: `📄 Contenu du fichier *${filePath}* :\n\`\`\`${data}\`\`\``
};

// Envoi du message à Slack
fetch(webhookURL, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(message)
})
.then(response => {
if (response.ok) {
console.log('✅ Message envoyé sur Slack avec succès !');
} else {
console.error('❌ Erreur lors de l"envoi à Slack:', response.statusText);
}
})
.catch(error => console.error('⚠️ Erreur réseau:', error));
});
