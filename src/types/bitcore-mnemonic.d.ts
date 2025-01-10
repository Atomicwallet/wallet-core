declare module 'bitcore-mnemonic' {
  import { Buffer } from 'buffer';
  import { HDPrivateKey, Networks } from 'bitcore-lib';

  export default class Mnemonic {
    phrase: string;
    wordlist: string[];

    /**
     * Constructor for the Mnemonic class.
     * @param data - A seed, phrase, or entropy to initialize (optional).
     * @param wordlist - The wordlist to generate mnemonics from (optional).
     */
    constructor(data?: string | Buffer | number, wordlist?: string[]);

    /**
     * Validates if a mnemonic is valid.
     * @param mnemonic - The mnemonic string.
     * @param wordlist - The wordlist used for validation (optional).
     * @returns True if the mnemonic is valid, false otherwise.
     */
    static isValid(mnemonic: string, wordlist?: string[]): boolean;

    /**
     * Generates a Mnemonic object from a seed.
     * @param seed - The entropy seed buffer.
     * @param wordlist - The wordlist to use (optional).
     * @returns A Mnemonic instance.
     */
    static fromSeed(seed: Buffer, wordlist?: string | string[]): Mnemonic;

    /**
     * Generates a seed from the mnemonic and an optional passphrase.
     * @param passphrase - The optional passphrase for seed generation.
     * @returns A Buffer containing the seed.
     */
    toSeed(passphrase?: string): Buffer;

    /**
     * Converts the mnemonic to an HDPrivateKey.
     * @param passphrase - Optional passphrase for additional security.
     * @param network - The network to use ('livenet', 'testnet', etc.) (optional).
     * @returns An HDPrivateKey instance.
     */
    toHDPrivateKey(passphrase?: string, network?: Networks.Network | string | number): HDPrivateKey;

    /**
     * Converts the mnemonic to a string.
     * @returns The mnemonic string.
     */
    toString(): string;

    /**
     * Formats the mnemonic for console output.
     * @returns A formatted string representation of the mnemonic.
     */
    inspect(): string;

    /**
     * The available wordlists.
     */
    static Words: {
      ENGLISH: string[];
      JAPANESE: string[];
      SPANISH: string[];
      FRENCH: string[];
      ITALIAN: string[];
      KOREAN: string[];
      [key: string]: string[];
    };
  }
}
