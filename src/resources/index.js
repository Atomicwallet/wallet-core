// import { ConfigKey } from '../ConfigManager/ConfigManager.const'

import WalletsFee from './wallets_fee.json'

/* articles */
import LearnStaking from './articles/learn-stacking.json'

/* binance */
import BscTokens from './binance/bsc-tokens.json'
import BscTokensBanned from './binance/bsc-tokens-banned.json'
// import Markets from'./binance/markets.json' // Not exist in external configs
// import Tokens from './binance/tokens.json' // Not exist in external configs

/* cashback */
import CashbackSettings from './cashback/index'

/* eth */
import EthereumTokens from './eth/tokens.json'
import EthereumTokensBanned from './eth/tokens-banned.json'

/* trx */
import TrxTokens from './trx/tokens.json'
import TrxTokensBanned from './trx/tokens-banned.json'

/* op */
import OptimismTokens from './op/tokens.json'
import OptimismTokensBanned from './op/tokens-banned.json'

/* exchange */
import ChangeNowOmniTickers from './exchange/CN_OMNI_TICKERS.json'
import ChangeNowUniqueTickers from './exchange/CN_TICKERS_CONFIG.json'

/* simplex */
import SimplexAliases from './simplex/simplex-aliases.json'

/* validators */
// import Validators from './staking/validators.json' // @TODO Research - different structures

import BalanceTracking from './balance-tracking.json'

export const fallbackConfigs = {
  [ConfigKey.WalletsFee]: WalletsFee,
  [ConfigKey.LearnStaking]: LearnStaking,
  [ConfigKey.BscTokens]: BscTokens,
  [ConfigKey.BscTokensBanned]: BscTokensBanned,
  [ConfigKey.CashbackSettings]: CashbackSettings,
  [ConfigKey.EthereumTokens]: EthereumTokens,
  [ConfigKey.EthereumTokensBanned]: EthereumTokensBanned,
  [ConfigKey.ChangeNowOmniTickers]: ChangeNowOmniTickers,
  [ConfigKey.ChangeNowUniqueTickers]: ChangeNowUniqueTickers,
  [ConfigKey.SimplexAliases]: SimplexAliases,
  [ConfigKey.BalanceTracking]: BalanceTracking,
  [ConfigKey.TrxTokens]: TrxTokens,
  [ConfigKey.TrxTokensBanned]: TrxTokensBanned,
  [ConfigKey.OptimismTokens]: OptimismTokens,
  [ConfigKey.OptimismTokensBanned]: OptimismTokensBanned,
  [ConfigKey.IpfsGateway]: [],
}
