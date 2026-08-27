const { launchBrowserOnBrowserStack } = require('../../utils/Utils');
const { skipPedago } = require('./AuthPassive');
const { setCard } = require('./carte');
const { setRib } = require('./Linxo');
const { fillForm, skipIntro, skipIntroConnuCredit } = require('./Mini-Formulaire');
const { checkRecapitulatifInfos } = require('./Recapitulatif');
const { acceptConditonsSeCeasy, setOtpAndValidateCeasy } = require('./SE');

module.exports = {
     // env : process.env.ENV || "https://rct2.sofinco.fr",
     env : process.env.ENV || "https://recette.esigate.sofinco.fr",

    // ESSENTIEL
    setInfos: require('./Coordonees').setInfos,
    validateInfos: require('./Informations').validateInfos,
    nextPedagogieId: require('./Pedagogie').nextPedagogieId,
    uploadCI: require('./Identite').uploadCI,
    selectCI: require('./Identite').selectCI,
    selectAndUpload: require('./Identite').selectAndUpload,
    selectAndUploadV2: require('./Identite').selectAndUploadV2,

    confirmLieuNaissance: require('./Identite').confirmLieuNaissance,
    valider_recevez_offres_et_bon_plan: require('./Identite').validerRecevezOffresEtBonPlan,
    setStatutMarital: require('./StatutMarital').setStatutMarital,
    connectLinxoAccount: require('./Linxo').connectLinxoAccount,
    selectFirstAccount: require('./Linxo').selectFirstAccount,
    setRib: require('./Linxo').setRib,

    setCsp: require('./Csp').setCsp,
    fillForm: require('./Mini-Formulaire').fillForm,
    skipIntro: require('./Mini-Formulaire').skipIntro,
    skipIntroConnuCredit: require('./Mini-Formulaire').skipIntroConnuCredit,



    setAdresse: require('./Adresse').setAdresse,
    setAssurance: require('./Assurance').setAssurance,
    setCard: require('./carte').setCard,
    checkRecapitulatifInfos: require('./Recapitulatif').checkRecapitulatifInfos,
    acceptRecapitulatifInfos: require('./Recapitulatif').acceptRecapitulatifInfos,
    acceptRecapitulatifFinancement: require('./Recapitulatif').acceptRecapitulatifFinancement,
    acceptNoticeSE: require('./NoticeSE').acceptNoticeSE,
    acceptConditons: require('./SE').acceptConditons,
    acceptConditonsSeCeasy: require('./SE').acceptConditonsSeCeasy,
    setOtpAndValidateCeasy: require('./SE').setOtpAndValidateCeasy,
    setOtpAndValidate: require('./SE').setOtpAndValidate,
    skipPedagogieMiTrust: require('./MiTrust').skipPedagogieMiTrust,
    miTrust_se_connecter: require('./MiTrust').miTrust_se_connecter,
    skipPedago: require('./AuthPassive').skipPedago,
    setOtpAndValidateAuthPassive: require('./AuthPassive').setOtpAndValidate,


  };