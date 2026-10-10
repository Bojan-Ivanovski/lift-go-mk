/** Configure these values only after LiftGoMK confirms its price list. Undefined keeps the calculator in quote-request mode. */
export const pricing = {
  baseFee: undefined as number | undefined,
  perFloor: undefined as number | undefined,
  perHour: undefined as number | undefined,
  locationSurcharge: undefined as Record<string, number> | undefined,
  handlingFee: undefined as number | undefined,
};
