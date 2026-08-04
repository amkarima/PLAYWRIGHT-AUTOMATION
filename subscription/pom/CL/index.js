const { launchBrowserOnBrowserStack } = require('../../utils/Utils');
const { setEmailTelAndValidateCeasy } = require('./CL');

module.exports = {
   env : process.env.ENV || "https://recette.esigate.sofinco.fr",
   generateCL: require('./CL').generate,
   generateNxcb: require('./CL').generateNxcb,
   setEmailTelAndValidate: require('./CL').setEmailTelAndValidate,
   setEmailTelAndValidateCeasy: require('./CL').setEmailTelAndValidateCeasy,
   setEmailTelAndValidate2: require('./CL').setEmailTelAndValidate2,

   continuerAvecCetteOffre: require('./CL').continuerAvecCetteOffre,
   continuer: require('./CL').continuer,
   setCard: require('./CL').setCard,
   je_souscris_a_la_carte: require('./CL').je_souscris_a_la_carte,
  };