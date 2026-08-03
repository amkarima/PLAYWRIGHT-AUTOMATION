const { startFinancementFromMySof } = require('./MySof.ts');

module.exports = {
    env : process.env.MYSOF_ENV || "https://rct.mon-espace-client.sofinco.fr",

    startFinancementFromMySof: require('./MySof.ts').startFinancementFromMySof
  };