import type Coin from '../../abstract/coin.js';
import type { CoinConfigType } from '../../abstract/types/coinTypes.js';
export declare enum TokenSource {
    List = "list",
    User = "user",
    Custom = "custom"
}
export type TokenIdParts = {
    ticker: string;
    contract: string;
    parent: string;
    network?: string;
};
export type TokenCreationArgs = {
    parent: Coin;
    name: string;
    ticker: string;
    decimal: number;
    contract: string;
    source: TokenSource;
    visibility: boolean;
    confirmed: boolean;
    config: CoinConfigType;
    uniqueField: string;
    parentTicker: string;
    notify?: boolean;
    memoRegexp?: string;
};
