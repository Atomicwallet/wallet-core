/**
 * Delays execution by the specified number of milliseconds
 */
export const sleepFor = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
