import type { IKeys } from './types.js';
export declare const initializeMnemonic: (phrase?: string) => Promise<IKeys>;
export declare const validateMnemonic: (mnemonic: string) => Promise<boolean>;
