import {createApiContext} from "../api/Ceasy"
import { CEASY_PARTNERS } from "../config/ceasy.config";

export function buildSimulation({amount, scaleCode, hasInsurance = true,}: {
  amount: number;
  scaleCode: string;
  hasInsurance?: boolean;
}) {
  return {
    amount,
    scaleCode,
    borrower: {
      hasInsurance,
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

export function buildSimulationUrl(partner: (typeof CEASY_PARTNERS)[keyof typeof CEASY_PARTNERS],campaign : string): string {
  return `https://rct-api.sofinco.fr/revolvingSimulation/v3/partners/${partner.channel}/campaigns/${campaign}/simulations/revolvings/calculate`;
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
    emailAddress: customer.emailAddress ?? "jmanson@ca-cf.fr"
  };

  const customerContext = {
    civilityCode: localisation.civilityCode ?? "1",
    firstName: customerData.firstName,
    lastName: customerData.lastName.toUpperCase(),

    birthCity: localisation.birthCity ?? "Evry",
    birthZipCode: localisation.birthZipCode ?? "91000",
    citizenshipCode: localisation.citizenshipCode ?? "F",
    birthCountryCode: localisation.birthCountryCode ?? "F",

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
        const payload = `{"amount": 2500,"scaleCode": "CASCR12","borrower": {"hasInsurance": true }}`;
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
          return data.id as string;
      } finally {
        await context.dispose();
      }
}