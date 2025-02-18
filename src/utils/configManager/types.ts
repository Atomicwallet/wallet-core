export type ConfigManagerResponse = Array<any> | Record<string, any>;

export interface IConfigManager {
  register(id: string): void;
  get(id: string): Promise<ConfigManagerResponse>;
  getLocal(id: string): Promise<ConfigManagerResponse | undefined>;
}

export enum ConfigKey {
  AvaxCGasPrice = 'avax-c-gas-price',
  BnbTokens = 'bnb-tokens',
  EthereumGasPrice = 'eth-gas-price',
  EthereumTokens = 'ethereum-tokens',
  EthereumTokensBanned = 'ethereum-tokens-banned',
  FantomGasPrice = 'ftm-gas-price',
  FantomTokens = 'fantom-tokens',
  FantomTokensBanned = 'fantom-tokens-banned',
  FlareTokens = 'flare-tokens',
  FlareTokensBanned = 'flare-tokens-banned',
  OptimismTokens = 'optimism-tokens',
  OptimismTokensBanned = 'optimism-tokens-banned',
  FlareClaimExecutors = 'flare-claim-executors',
  ArbitrumTokens = 'arbitrum-tokens',
  ArbitrumTokensBanned = 'arbitrum-tokens-banned',
  BscTokens = 'bsc-tokens',
  BscTokensBanned = 'bsc-tokens-banned',
  PolygonTokens = 'polygon-tokens',
  PolygonTokensBanned = 'polygon-tokens-banned',
  PolygonGasPrice = 'polygon-gas-price',
  LogSettings = 'logs-settings',
  StakingCoins = 'staking-coins-list',
  WalletsFee = 'wallets_fee_10',
  LunaClassicGasPrice = 'lunc-gas-price',
  LunaClassicTokens = 'luna-classic-tokens',
  LunaTokensBanned = 'luna-tokens-banned',
  TrxTokens = 'trx-tokens',
  TrxTokensBanned = 'trx-tokens-banned',
  SolTokens = 'sol-tokens',
  SolTokensBanned = 'sol-tokens-banned',
  TonTokens = 'ton-tokens',
  TonTokensBanned = 'ton-tokens-banned',

  // IPFS
  IpfsGateway = 'ipfs-gateway',
  FiltersAndGroups = 'move-lists',

  // used for tests
  BitcoinFeeForecast = 'bitcoin-fee-forecast',
}

export enum TokensConfigKey {
  ETHTokens = ConfigKey.EthereumTokens,
  BSCTokens = ConfigKey.BscTokens,
  ARBTokens = ConfigKey.ArbitrumTokens,
  TRXTokens = ConfigKey.TrxTokens,
  FLRTokens = ConfigKey.FlareTokens,
  MATICTokens = ConfigKey.PolygonTokens,
  LUNCTokens = ConfigKey.LunaClassicTokens,
  FTMTokens = ConfigKey.FantomTokens,
  OPTokens = ConfigKey.OptimismTokens,
  BNBTokens = ConfigKey.BnbTokens,
}
