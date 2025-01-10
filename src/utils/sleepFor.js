/**
 * Delays execution by the specified number of milliseconds
 *
 * @async
 * @param {number} milliseconds
 * @returns {Promise<unknown>}
 */
export const sleepFor = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
