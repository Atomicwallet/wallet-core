import type Coin from 'src/abstract/coin';
import type { CoinConfigType } from 'src/abstract/types/coinTypes';

export enum TokenSource {
  List = 'list',
  User = 'user',
  Custom = 'custom',
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
  notify?: boolean;
  memoRegexp?: string;
};
