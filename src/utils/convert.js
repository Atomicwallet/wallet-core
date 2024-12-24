import BN from 'bn.js';

export const MILLISECONDS_IN_ONE_SECOND = 1000;
const LEADING_ZEROES_REGEX = /^0+/;

/**
 * Converts a positive number string to coin minimal units.
 *
 * @param {string} numStr
 * @param {number} precision
 * @returns {string}
 */
function positiveNumToMinimal(numStr, precision) {
  numStr = numStr.replace(LEADING_ZEROES_REGEX, '');

  if (!numStr) {
    return '0';
  }

  // number of shifts to move decimal point to right and pad result with zeroes
  let remainingShifts = precision;

  // handle exponential notation
  if (numStr.includes('e')) {
    const [base, expStr] = numStr.split('e', 2);

    numStr = base;
    remainingShifts += Number(expStr);
    if (remainingShifts < 0) {
      return '0';
    }
  }

  // we don't care about fraction when precision is 0
  if (precision === 0) {
    numStr = numStr.split('.', 2)[0];

    if (numStr === '' || numStr === '0') {
      return '0';
    }
  } else {
    const dotPosition = numStr.indexOf('.');

    // remove decimal point and update remaining shifts
    if (dotPosition > -1) {
      const beforeDot = numStr.substring(0, dotPosition);
      // get fraction part and cut it to a needed precision if it is exceeded
      const afterDot = numStr.substring(
        dotPosition + 1,
        dotPosition + 1 + remainingShifts,
      );

      numStr = `${beforeDot}${afterDot}`.replace(LEADING_ZEROES_REGEX, '');
      remainingShifts -= afterDot.length;
    }
  }

  return remainingShifts > 0
    ? numStr.padEnd(remainingShifts + numStr.length, '0')
    : numStr;
}

/**
 * To quants satoshi, wei, etc...
 *
 * @param {Number|String|BN} value
 * @param {number} precision
 * @return {String}
 */
export function toMinimal(value, precision) {
  // WARNING! Don't try to use BigNumber here, it doesn't work with some numbers like 123.000000000000123459991299.
  // JavaScript will round this number because of floating point precision limitations.
  // return new BigNumber(value).times(10 ** decimal).toFixed(0, BigNumber.ROUND_DOWN) // mostly works, but not always
  if (!Number.isInteger(precision) || precision < 0) {
    throw new TypeError('toMinimal error: precision is not a positive integer');
  }

  let numStr = value.toString().replace(',', '.');
  const isNegative = numStr.startsWith('-');

  if (isNegative) {
    numStr = numStr.substring(1);
  }

  const result = positiveNumToMinimal(numStr, precision);

  return result !== '0' && isNegative ? `-${result}` : result;
}

/**
 * To currency unit.
 *
 * @param {String|Number|BN} value
 * @param {number} decimal
 * @return {String}
 */
export function toCurrency(value, decimal) {
  if (value === null) {
    throw new Error('value must not be null'); // instead this will cause BN to crash with "out of memory"
  }
  if (typeof value === 'string') {
    if (value.indexOf('.') !== -1) {
      throw new Error(`${value} must not contain '.'`);
    }
    if (value.indexOf('-') !== -1) {
      throw new Error(`${value} must not contain '-'`);
    }
    if (typeof decimal !== 'number') {
      throw new TypeError('toCurrency error: decimal is not a number');
    }
  }

  const valueBN = new BN(value);

  if (valueBN.lte(0)) {
    throw new Error('negative');
  }
  const valueString = new BN(value).toString();

  const integerPart =
    valueString.substring(0, valueString.length - decimal).replace(/^0+/, '') ||
    0;

  const fractionPart = valueString
    .substring(valueString.length - decimal)
    .padStart(decimal, '0')
    .replace(/0+$/, '');

  if (fractionPart.search('-') !== -1) {
    console.warn('convert: toCurrency: fractionPart is bad');
  }

  if (fractionPart !== '') {
    return `${integerPart}.${fractionPart}`;
  }

  return `${integerPart}`;
}

/**
 * Convert timestamp to DateTime
 *
 * @param {number} timestamp - Timestamp.
 * @param {number} timestampsInOneSecond - Determines how many timestamp units are in one second.
 * @returns {Date}
 */
export function convertTimestampToDateTime(timestamp, timestampsInOneSecond) {
  return new Date(
    (timestamp * MILLISECONDS_IN_ONE_SECOND) / timestampsInOneSecond,
  );
}

/**
 * Convert seconds to DateTime
 *
 * @param {number} seconds - Seconds.
 * @returns {Date}
 */
export function convertSecondsToDateTime(seconds) {
  return convertTimestampToDateTime(seconds, 1);
}

/**
 * Gets a string with a guaranteed character at the end of the string
 *
 * @param {string} str
 * @param {string} charAtEnd
 * @returns {string}
 */
export function getStringWithEnsuredEndChar(str, charAtEnd) {
  return str.endsWith(charAtEnd) ? str : str.concat(charAtEnd);
}

/**
 * Convert value with scientific notation to value without one
 * @param {string|number} value value in scientific notation, but normal value is safe
 * @returns {string} value without scientific notation
 */
export function getNumberWithoutENotation(numStr) {
  numStr = numStr.toString().replace(LEADING_ZEROES_REGEX, '').toLowerCase();

  if (!numStr) {
    return '0';
  }

  if (!numStr.includes('e')) {
    return numStr;
  }

  const [base, expStr] = numStr.split('e', 2);

  numStr = base;
  const shifts = Number(expStr);

  if (shifts === 0) {
    return base;
  }

  const dotPosition = numStr.indexOf('.');

  if (dotPosition > -1) {
    const [beforeDot, afterDot] = numStr.split('.');

    if (shifts > 0) {
      if (shifts < afterDot.length) {
        return `${beforeDot}${afterDot.slice(0, shifts)}.${afterDot.slice(shifts)}`;
      }

      return `${beforeDot}${afterDot}${'0'.repeat(shifts - afterDot.length)}`;
    }

    return `0.${beforeDot.padStart(Math.abs(shifts) - 1 + beforeDot.length, '0')}${afterDot}`;
  }

  if (shifts > 0) {
    return numStr.padEnd(shifts + numStr.length, '0');
  }

  return `0.${numStr.padStart(Math.abs(shifts) - 1 + numStr.length, '0')}`;
}
