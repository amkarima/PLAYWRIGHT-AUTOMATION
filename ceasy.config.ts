export const CEASY_PARTNERS = {
  CASTORAMA: {
    partnerId:  "creditPartner",
    businessProviderId: "99102325769",
    scaleCode: "CASCR12",
    scaleId: "CASTOPAC",
    frontCode: "ESSCEA",
    craFile: "cra_castorama.json",
    workflow: "cra_wis",
    channel: "web_castorama",
    campaign: "cra",
    exchangeUrl: "https://sofinco.exchange/demo",
    returnUrl: "https://www.castorama.fr",
  },

  DECATHLON: {
    partnerId: "99102325770",
    businessProviderId: "99102325770",
    scaleCode: "DECCR12",
    scaleId: "DECTOPAC",
    frontCode: "ESSCEA",
    craFile: "cra_decathlon.json",
    workflow: "cra_wis",
    channel: "web_decathlon",
    campaign: "cra",
    exchangeUrl: "https://sofinco.exchange/demo",
    returnUrl: "https://www.decathlon.fr",
  },
} as const;