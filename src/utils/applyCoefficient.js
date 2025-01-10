import BN from 'bn.js';

const DEFAULT_PRECISION = 10 ** 3;

/**
 * @param {number | string | BN} value
 * @param {number} coefficient
 * @param {number | undefined} precision - `1000`, `10000`, etc.
 * @returns {BN}
 */
export default function applyCoefficient(
  value,
  coefficient,
  precision = DEFAULT_PRECISION,
) {
  const preRoundedMultiplier = new BN(coefficient * precision);

  return new BN(value).mul(preRoundedMultiplier).div(new BN(precision));
}
