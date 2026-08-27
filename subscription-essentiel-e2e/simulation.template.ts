// simulation.template.ts

export interface SimulationInput {
  amount: number;
  scaleCode: string;
  hasInsurance?: boolean;
}

export function buildSimulation({
  amount,
  scaleCode,
  hasInsurance = true,
}: SimulationInput) {
  return {
    amount,
    scaleCode,
    borrower: {
      hasInsurance,
    },
  };
}