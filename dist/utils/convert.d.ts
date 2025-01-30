import BN from 'bn.js';
export declare const MILLISECONDS_IN_ONE_SECOND = 1000;
/**
 * To quants satoshi, wei, etc...
 */
export declare function toMinimal(value: number | string | BN, precision: number): string;
/**
 * To currency unit.
 */
export declare function toCurrency(value: number | string | BN, decimal: number): string;
/**
 * Convert timestamp to DateTime
 */
export declare function convertTimestampToDateTime(timestamp: number, timestampsInOneSecond: number): Date;
/**
 * Convert seconds to DateTime
 */
export declare function convertSecondsToDateTime(seconds: number): Date;
/**
 * Gets a string with a guaranteed character at the end of the string
 */
export declare function getStringWithEnsuredEndChar(str: string, charAtEnd: string): string;
/**
 * Convert value with scientific notation to value without one
 */
export declare function getNumberWithoutENotation(numStr: string | number): string;
