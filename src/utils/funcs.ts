import objectHash, { NotUndefined } from 'object-hash';

const CURRENT_LOCALE = 'en-US';

async function delayedCall<T>(func: (...args: any[]) => Promise<T>, args: unknown[], interval: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
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

export async function delayedRepeatUntilSuccess<T>(
  func: (...args: unknown[]) => Promise<T>,
  args: unknown[],
  times: number,
  interval: number,
): Promise<T | undefined> {
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

export function formatAmount(number: number) {
  return new Intl.NumberFormat(CURRENT_LOCALE).format(number);
}

export function isStartsWith(str: string, searchTerm: string) {
  return str.indexOf(searchTerm) === 0;
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function isDifferent(object1: NotUndefined, object2: NotUndefined) {
  return objectHash(object1) !== objectHash(object2);
}
