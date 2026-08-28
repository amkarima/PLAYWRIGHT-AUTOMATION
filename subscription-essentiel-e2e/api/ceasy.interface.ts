export interface SubscribeParams {
  apporteur: string;
  amount: number;
  hasInsurance?: boolean;
  duration?: number;
  orderId?: string;
  campaign?: string;
  [key: string]: unknown;
}
