export type FamilyName = 'ceasy' | 'cl' | 'cc';

export interface PartnerConfig {
  family: FamilyName;
  partnerId?: string;
  businessProviderId?: string;
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
    partnerId: 'creditPartner',
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
        scaleCode: 'CASCR12',
        scaleId: 'CASTOPAC',
        frontCode: 'ESSCEA',
        channel: 'web_castorama',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.castorama.fr',
      },
      DECATHLON: {
        businessProviderId: '99102325770',
        scaleCode: 'DECCR12',
        scaleId: 'DECTOPAC',
        frontCode: 'ESSCEA',
        channel: 'web_decathlon',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.decathlon.fr',
      },
      FNAC: {
        businessProviderId: 'web_fnac',
        scaleCode: 'FNACR12',
        scaleId: 'FNACOPAC',
        frontCode: 'ESSCEA',
        channel: 'web_fnac',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.fnac.com',
      },
      IKEA: {
        businessProviderId: 'web_ikea',
        scaleCode: 'IKECR12',
        scaleId: 'IKEOPAC',
        frontCode: 'ESSCEA',
        channel: 'web_ikea',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.ikea.com',
      },
      PRINTEMPS: {
        businessProviderId: 'web_printemps',
        scaleCode: 'PTCR12',
        scaleId: 'PTOPAC',
        frontCode: 'ESSCEA',
        channel: 'web_printemps',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.printemps.com',
      },
      EM: {
        businessProviderId: 'web_em',
        scaleCode: 'EMCR12',
        scaleId: 'EMOPAC',
        frontCode: 'ESSCEA',
        channel: 'web_em',
        exchangeUrl: 'https://sofinco.exchange/demo',
        returnUrl: 'https://www.em.fr',
      },
      DARTY: {
        businessProviderId: 'web_darty',
        scaleCode: 'DARTCR12',
        scaleId: 'DARTOPAC',
        frontCode: 'ESSCEA',
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
        businessProviderId: 'web_darty',
        channel: 'web_darty',
        campaign: 'cra',
        returnUrl: 'https://www.darty.com',
      },
      FNAC: {
        businessProviderId: 'web_fnac',
        channel: 'web_fnac',
        campaign: 'cra',
        returnUrl: 'https://www.fnac.com',
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
      WEB_CL: {
        businessProviderId: 'web_cl',
        channel: 'web_cl',
        campaign: 'cra',
        returnUrl: 'https://www.sofinco.fr',
      },
      WEB_MM: {
        businessProviderId: 'web_mm',
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
