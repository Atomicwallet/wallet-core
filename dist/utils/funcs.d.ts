import { NotUndefined } from 'object-hash';
export declare function delayedRepeatUntilSuccess<T>(func: (...args: unknown[]) => Promise<T>, args: unknown[], times: number, interval: number): Promise<T | undefined>;
export declare function formatAmount(number: number): string;
export declare function isStartsWith(str: string, searchTerm: string): boolean;
export declare function getRandomInt(max: number): number;
export declare function isDifferent(object1: NotUndefined, object2: NotUndefined): boolean;
