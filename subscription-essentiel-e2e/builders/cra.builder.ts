import {createApiContext} from "../api/Ceasy"
import { PartnerConfig } from "../config/partner";

export function buildSimulation({
  amount,
  duration,
  scaleCode,
  businessProviderId,
  hasInsurance = true,
  isSale,
  equipmentCode,
  dueDay,
  personalContributionAmount,
  isPrincipal,
}: {
  amount: number;
  duration?: number;
  scaleCode?: string;
  businessProviderId: string;
  hasInsurance?: boolean;
  isSale?: boolean;
  equipmentCode?: string;
  dueDay?: number;
  personalContributionAmount?: number;
  isPrincipal?: boolean;
}) {
  return {
    amount,

    ...(duration && { durations: [duration] }),
    ...(scaleCode && { scaleCode }),
    ...(equipmentCode && { equipmentCode }),
    ...(dueDay !== undefined && { dueDay }),
    ...(isSale !== undefined && { isSale }),
    ...(personalContributionAmount !== undefined && {
      personalContributionAmount,
    }),
    ...(isPrincipal !== undefined && { isPrincipal }),

    businessProviderId,

    borrowersParameter: {
      hasInsurance,
      socioEconomicClassificationCode: '',
      insuranceCode: '',
      retrieveAlternativeInsurances: false,
    },
  };
}

import { randomInt } from "crypto";

interface BuildCraContextParams {
  simulationId: string;
  amount: number;
  scaleCode: string;
  orderId?: string;
  duration?: number;

  customer?: {
    firstName?: string;
    lastName?: string;
    mobilePhoneNumber?: string;
    emailAddress?: string;
  };

  localisation?: {
    civilityCode?: string;
    birthCity?: string;
    birthZipCode?: string;
    citizenshipCode?: string;
    birthCountryCode?: string;
    street?: string;
    city?: string;
    zipCode?: string;
    distributerOffice?: string;
  };

 apporteur: {
  businessProviderId: string;
  scaleId: string;
  frontCode: string;
  returnUrl: string;
  exchangeUrl: string;
};
}

export function buildSimulationUrl(
  partner: PartnerConfig,
  campaign: string
): string {

  const partnerCode =
    campaign === 'vac'
      ? partner.vacSimulationPartner ?? partner.channel
      : partner.simulationPartner ?? partner.channel;
      

  if (campaign === 'vac') {
    return `https://rct-api.sofinco.fr/creditSaleSimulation/v1/partners/${partnerCode}/campaigns/vac/simulations/creditSales/calculate`;
  }

  return `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/${partnerCode}/campaigns/${campaign}/simulations/revolvings/calculate`;
}

export function buildCraContext({
  simulationId,
  amount,
  scaleCode,
  duration = 12,
  orderId = randomInt(1000000, 9999999).toString(),
  apporteur,
  customer = {},
  localisation = {}
}: BuildCraContextParams) {

  const customerData = {
    firstName: customer.firstName ?? "Karima",
    lastName: customer.lastName ?? "Amrouche",
    mobilePhoneNumber: customer.mobilePhoneNumber ?? "",
    emailAddress: customer.emailAddress ?? "testAuto@ca-cf.fr"
  };

  const customerContext = {
    civilityCode: localisation.civilityCode ?? "1",
    firstName: customerData.firstName,
    lastName: customerData.lastName.toUpperCase(),

    birthCity: localisation.birthCity ?? "Evry",
    birthZipCode: localisation.birthZipCode ?? "91000",
    citizenshipCode: localisation.citizenshipCode ?? "FR",
    birthCountryCode: localisation.birthCountryCode ?? "FR",

    street: localisation.street ?? "12 avenue de l'Europe",
    city: localisation.city ?? "PARIS",
    zipCode: localisation.zipCode ?? "75012",
    distributerOffice: localisation.distributerOffice ?? "PARIS",

    mobileNumber: customerData.mobilePhoneNumber,
    externalCustomerId: "release240",
    emailAddress: customerData.emailAddress
  };

  const businessContext = {
    providerContext: {
      businessProviderId: apporteur.businessProviderId,
      returnUrl: apporteur.returnUrl,
      exchangeUrl: apporteur.exchangeUrl,

      sellerUserId: "jejevend",
      originFrontCode: apporteur.frontCode,

      prescriber: {
        name: "presnom",
        externalProviderId: "12121",
        employeeCode: "455455",
        saleGroup: "111",
        departmentCode: "222",
        status: "D"
      }
    },

    customerContext,

    offerContext: {
      orderId,
      scaleId: apporteur.scaleId,
      duration: duration.toString(),
      orderAmount: amount * 100,
      amount: amount * 100
    },

    simulationContext: {
      simulationId,
      dueNumber: duration,
      scaleCode
    }
  };

  return {
        customer: customerData,
        order: {
          id: orderId,
          businessProviderId: apporteur.businessProviderId,
          amount
        },
        tokenFormat: "OPAQUE",
        businessContext: JSON.stringify(businessContext),
        tokenDuration: 3600
     };
}

export async function getSimulationCeasy(token: string, endpoint: string, simulationPayload: ReturnType<typeof buildSimulation>, applicationId: string): Promise<string> {
  const context = await createApiContext();
  try {
        const response = await context.post(endpoint, {
          headers: {
            "Content-Type": "application/json",
            "Context-Applicationid": applicationId,
            Authorization: `Bearer ${token}`,
          },
          data: JSON.stringify(simulationPayload),
          });

          if (!response.ok()) {
            const errorBody = await response.text();
            throw new Error(
              `HTTP error ${response.status()} : ${errorBody}`
            );
          }

          const data = await response.json();
          console.log("************simulation response", data);
          return data.id as string;
      } finally {
        await context.dispose();
      }
}