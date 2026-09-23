export const validId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
export const routeId = (value: string | undefined) => Number(value);
