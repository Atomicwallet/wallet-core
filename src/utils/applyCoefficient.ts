import BN from 'bn.js';

const DEFAULT_PRECISION = 10 ** 3;

export default function applyCoefficient(
  value: number | string | BN,
  coefficient: number,
  precision = DEFAULT_PRECISION,
) {
  const preRoundedMultiplier = new BN(coefficient * precision);

  return new BN(value).mul(preRoundedMultiplier).div(new BN(precision));
}
