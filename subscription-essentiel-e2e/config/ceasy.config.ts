export {
  PARTNER_DEFAULTS,
  PARTNER_REGISTRY,
  getPartnerConfig,
  type FamilyName,
  type PartnerConfig,
} from './partners';

export const CEASY_PARTNERS = PARTNER_REGISTRY.ceasy.partners as Record<string, any>;
