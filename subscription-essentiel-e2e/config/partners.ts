export type FamilyName = 'ceasy' | 'cl' | 'cc';
export type CeasyPartner =
  | 'CASTORAMA'
  | 'DARTY'
  | 'FNAC'
  | 'IKEA'
  | 'PRINTEMPS'
  | 'MM'
  | 'EM';

  export type FullWebClPartner =
  | 'DARTY'
  | 'FNAC'
  | 'IKEA'
  | 'PRINTEMPS'
  | 'DECATHLON'
  | 'REDOUTE'
  | 'CL'
  | 'MM';
  
export interface PartnerConfig {
  family: FamilyName;
  partnerId?: string;
  applicationId?: string;
  vacApplicationId?: string;
  simulationPartner?: string;
  businessProviderId?: string;
  crsApplicationId?: string;
  vacSimulationPartner?: string;
  contextFile?: string;
  scaleCode?: string;
  scaleId?: string;
  frontCode?: string;
  workflow?: string;
  channel?: string;
  campaign?: string;
  exchangeUrl?: string;
  returnUrl?: string;
  amount?: number;
  duration?: number;
  hasInsurance?: boolean;
  productId?: string;
  projectLabel?: string;
  dueNumber?: number;
  sourceId?: string;
  [key: string]: unknown;
}

export interface FamilyConfig {
  defaults: Partial<PartnerConfig>;
  partners: Record<string, Partial<PartnerConfig>>;
}

export const PARTNER_DEFAULTS: Record<FamilyName, Partial<PartnerConfig>> = {
  ceasy: {
    family: 'ceasy',
    campaign: 'cra',
    workflow: 'cra_wis',
    amount: 2500,
    duration: 12,
    hasInsurance: true,
  },
  cl: {
    family: 'cl',
    campaign: 'cra',
    workflow: 'cra_wis',
    partnerId: 'creditPartner',
    amount: 2000,
    duration: 12,
    hasInsurance: true,
  },
  cc: {
    family: 'cc',
    campaign: 'crs',
    workflow: 'cc_wis',
    partnerId: 'creditPartner',
    amount: 3000,
    duration: 24,
    hasInsurance: false,
  },
};

export const PARTNER_REGISTRY: Record<FamilyName, FamilyConfig> = {
  ceasy: {
    defaults: PARTNER_DEFAULTS.ceasy,
    partners: {
      CASTORAMA: {
        businessProviderId: '99102325769',
        applicationId: 'creditPartner',
        scaleCode: 'CASCR12',
        scaleId: 'CASTOPAC',
        frontCode: 'ESSCEA',
        simulationPartner: 'web_castorama',
        channel: 'web_castorama',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.castorama.fr',
      },
      FNAC: {
        businessProviderId: '99102020395',
        applicationId: 'essential',
        vacApplicationId: 'creditPartner',
        crsApplicationId: 'essential',
        scaleCode: 'FLIBR',
        scaleId: 'FLIBR',
        frontCode: 'ESSCEA',
        channel: 'web_fnac',
        simulationPartner: 'web_fnac',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.fnac.com',
      },
      IKEA: {
        businessProviderId: '99102325769',
        applicationId: 'creditPartner',
        scaleCode: 'IK49X',
        scaleId: 'IK49X',
        frontCode: 'ESSCEA',
        channel: 'web_ikea',
        simulationPartner: 'web_ikea',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.ikea.com'
      },
      PRINTEMPS: {
        businessProviderId: '99102200995',
        applicationId: 'creditPartner',
        scaleCode: '11210',
        scaleId: '11210',
        frontCode: 'ESSCEA',
        simulationPartner: 'web_printemps',
        channel: 'web_printemps',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.printemps.com',
      },
      EM: {
        businessProviderId: '30116432009',
        applicationId: 'creditPartner',
        scaleCode: 'FORF3ESE',
        scaleId: 'FORF3ESE',
        frontCode: 'ESSCEA',
        channel: 'web_em',
        simulationPartner: 'web_em',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.em.fr',
      },
      MM: {
        businessProviderId: '99102493736',
        applicationId: 'creditPartner',
        scaleCode: 'WL990',
        scaleId: 'WL990',
        frontCode: 'ESSCEA',
        channel: 'web_cl',
        simulationPartner: 'web_cl',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.em.fr',
      },
      DARTY: {
        businessProviderId: '99102496219',
        applicationId: 'ceasy',
        vacApplicationId: 'creditPartner',
        scaleCode: 'DLIBR',
        scaleId: 'DLIBR',
        frontCode: 'ESSCEA',
        simulationPartner: 'pdv_darty',
        vacSimulationPartner: 'web_darty',
        channel: 'web_darty',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.darty.com',
      },
    },
  },
  cl: {
    defaults: PARTNER_DEFAULTS.cl,
    partners: {
      DARTY: {
        businessProviderId: '99100316520',
        channel: 'web_darty',
        campaign: 'cra',
        returnUrl: 'https://www.darty.com',
        contextFile: '../../datas/CL/darty.json'
      },
      FNAC: {
        businessProviderId: 'web_fnac',
        channel: 'web_fnac',
        campaign: 'cra',
        returnUrl: 'https://www.fnac.com',
        contextFile: '../../datas/CL/fnac.json'
      },
      IKEA: {
        businessProviderId: 'web_ikea',
        channel: 'web_ikea',
        campaign: 'cra',
        returnUrl: 'https://www.ikea.com',
      },
      PRINTEMPS: {
        businessProviderId: 'web_printemps',
        channel: 'web_printemps',
        campaign: 'cra',
        returnUrl: 'https://www.printemps.com',
      },
      REDOUTE: {
        businessProviderId: 'web_redoute',
        channel: 'web_redoute',
        campaign: 'cra',
        returnUrl: 'https://www.redoute.fr',
      },  
      DECATHLON: {
        businessProviderId: '99102325770',
        channel: 'web_decathlon',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.decathlon.fr',
      },
      CL: {
        businessProviderId: '30116432009',
        channel: 'web_cl',
        campaign: 'cra',
        returnUrl: 'https://www.sofinco.fr',
      },
      MM: {
        businessProviderId: '30116432009',
        channel: 'web_mm',
        campaign: 'cra',
        returnUrl: 'https://www.mmm.fr',
      },
    },
  },
  cc: {
    defaults: PARTNER_DEFAULTS.cc,
    partners: {
      PROSPECT: {
        businessProviderId: 'web_sofinco',
        channel: 'web_sofinco',
        campaign: 'crs',
        productId: 'RESERVE',
        projectLabel: 'FAMILY_MOVING',
        sourceId: 'NEOURL02',
        returnUrl: 'https://www.sofinco.fr',
      },
      PROSPECT_SAV: {
        businessProviderId: 'web_sofinco',
        channel: 'web_sofinco',
        campaign: 'crs',
        productId: 'RESERVE',
        projectLabel: 'FAMILY_MOVING',
        sourceId: 'NEOURL02',
        returnUrl: 'https://www.sofinco.fr',
      },
      CONNU_CREDIT: {
        businessProviderId: 'web_sofinco',
        channel: 'web_sofinco',
        campaign: 'crs',
        productId: 'RESERVE',
        projectLabel: 'FAMILY_MOVING',
        sourceId: 'NEOURL02',
        returnUrl: 'https://www.sofinco.fr',
      },
    },
  },
};

export function getPartnerConfig(
  family: FamilyName,
  partnerName: string,
  overrides: Partial<PartnerConfig> = {}
): PartnerConfig {
  const registry = PARTNER_REGISTRY[family] ?? PARTNER_REGISTRY.ceasy;
  const merged = {
    ...registry.defaults,
    ...(registry.partners[partnerName] ?? {}),
    ...overrides,
  } satisfies Partial<PartnerConfig>;

  return {
    family,
    ...merged,
  } as PartnerConfig;
}