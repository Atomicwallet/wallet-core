import { type Coin } from '../abstract/index.js';
import type { IKeys, IKeysObject } from '../utils/index.js';
declare const generateKeys: (wallet: Coin, { seed, phrase }: IKeys) => Promise<IKeysObject>;
declare const loadKeys: (wallet: Coin, keys: {
    address: string;
    privateKey: string;
}, { seed, phrase }: IKeys) => Promise<unknown>;
export { generateKeys, loadKeys };
