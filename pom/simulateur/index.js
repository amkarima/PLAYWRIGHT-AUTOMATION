const { launchBrowserOnBrowserStack } = require('../../utils/Utils');
const { goToAtijariwafaSimulation, goToAmundi, goToCrPremium } = require('./Simulation');

module.exports = {
    fastSimulation: require('./Simulation').fastSimulation,
    fastSimulationAuto: require('./Simulation').fastSimulationAuto,

    goToAtijariwafaSimulation: require('./Simulation').goToAtijariwafaSimulation,
    goToAmundi: require('./Simulation').goToAmundi,
    goToCrPremium: require('./Simulation').goToCrPremium,

    acceptPopupCookies: require('./Home').acceptPopupCookies,
  };