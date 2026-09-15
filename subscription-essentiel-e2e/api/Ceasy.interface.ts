import { CeasyPartner } from "../config/partners";

export interface SubscribeParams {
  apporteur:  CeasyPartner;
  campaign?: string;
  amount: number;
  duration?: number;
  hasInsurance?: boolean;
  orderId?: string;
}
