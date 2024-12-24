import objectHash from 'object-hash';

const CURRENT_LOCALE = 'en-US';

async function delayedCall(func, args, interval) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const res = await func(...args);

        resolve(res);
      } catch (error) {
        reject(error);
      }
    }, interval);
  });
}

export async function delayedRepeatUntilSuccess(func, args, times, interval) {
  for (let completed = 0; completed < times; completed++) {
    try {
      // if success quit
      return await delayedCall(func, args, interval);
    } catch (error) {
      // if failed repeat, but no more than <times> times
      console.warn(error);
    }
  }
  return undefined;
}

export function formatAmount(number) {
  return new Intl.NumberFormat(CURRENT_LOCALE).format(number);
}

export function isStartsWith(str, searchTerm) {
  return str.indexOf(searchTerm) === 0;
}

/**
 * Utility fn - Returns random integer [0, max)
 * Example: getRandomInt (3), Expected output: 0, 1, 2
 *
 * @param {Number} max - should be Integer
 * @returns {Number}
 */
export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function isDifferent(object1, object2) {
  return objectHash(object1) !== objectHash(object2);
}
