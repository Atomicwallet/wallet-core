export const WALLETS = {
  /**
   * New atomic id is available
   *
   * @event Wallets#new_atomic_id
   * @property {string} atomicId
   */
  NEW_ATOMIC_ID: 'new_atomic_id',

  FINISH_LOADING: 'finish-loading',
  FINISH_LOADING_ALL: 'finish-loading-all',
  RAISE_LOADING_ERROR: 'raise-loading-error',
  START_LOADING: 'start-loading',
  START_LOADING_ALL: 'start-loading-all',
  UPDATE_LOADING_PROGRESS: 'update-loading-progress',
  TX_SENT: 'tx-sent',
  WALLET_READY: 'wallet-ready',
  NEW_COINS_LOADED: 'new-coins-loaded',

  /**
   * Deactivate coin
   *
   * @event WALLETS#deactivate_coin
   * @property {string} id - Coin id.
   */
  DEACTIVATE_COIN: 'deactivate_coin',

  /**
   * Wallets updated with new data from external sources (i.e. config)
   *
   * @event WALLETS#wallets_update
   */
  UPDATE: 'wallets-update',

  BALANCE_UPDATED: 'balance-updated',
};

export const CONFIGS = {
  /**
   * Update config
   *
   * @event CONFIGS#update
   * @property {string} id - Config id.
   * @property {object} [options] - Custom fetch options.
   */
  UPDATE: 'update_config',

  /**
   * Config updated
   *
   * @event CONFIGS#updated
   * @property {string} id - Config id.
   * @property {Config} config - Updated config.
   */
  UPDATED: 'config_updated',

  /**
   * Log settings config updated
   *
   * @event CONFIGS#log_settings_config_updated
   * @property {Config} config - Updated log settings config.
   */
  LOG_SETTINGS_UPDATED: 'log_settings_config_updated',

  /**
   * Failed fetch config
   *
   * @event CONFIGS#failed_fetch
   * @property {string} id - Config id.
   */
  FAILED_FETCH: 'failed_fetch',
};
