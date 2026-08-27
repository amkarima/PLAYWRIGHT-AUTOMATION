export function buildCraContext({
  simulationId,
  orderId = generateOrderId(),
  amount,
  duration,
  partner,
}: CraContextInput) {

  return {
    customer: {
      firstName: "Jerome",
      lastName: "Manson",
      mobilePhoneNumber: "",
      emailAddress: "jmanson@ca-cf.fr",
    },

    order: {
      id: orderId,
      businessProviderId: partner.businessProviderId,
      amount,
    },

    tokenFormat: "OPAQUE",

    businessContext: JSON.stringify({
      providerContext: {
        businessProviderId: partner.businessProviderId,
        returnUrl: partner.returnUrl,
        exchangeUrl: "https://sofinco.exchange/demo",
        sellerUserId: "jejevend",

        originFrontCode: partner.frontCode,

        prescriber: {
          name: "presnom",
          externalProviderId: "12121",
          employeeCode: "455455",
          saleGroup: "111",
          departmentCode: "222",
          status: "D",
        },
      },

      customerContext: {
        civilityCode: "1",
        firstName: "Jérôme",
        lastName: "MANSON",
        birthCity: "Evry",
        birthZipCode: "91000",
        citizenshipCode: "F",
        birthCountryCode: "F",
        street: "12 avenue de l'Europe",
        city: "PARIS",
        distributerOffice: "PARIS",
        zipCode: "75012",
        mobileNumber: "0788972219",
        externalCustomerId: "release240",
        emailAddress: "jmanson@ca-cf.fr",
      },

      offerContext: {
        orderId,
        scaleId: partner.scaleId,
        duration: String(duration),
        orderAmount: amount * 100,
        amount: amount * 100,
      },

      simulationContext: {
        simulationId,
        dueNumber: duration,
        scaleCode: partner.scaleCode,
      },
    }),

    tokenDuration: 3600,
  };
}