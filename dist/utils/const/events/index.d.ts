export declare const WALLETS: {
    /**
     * New atomic id is available
     *
     * @event Wallets#new_atomic_id
     * @property {string} atomicId
     */
    NEW_ATOMIC_ID: string;
    FINISH_LOADING: string;
    FINISH_LOADING_ALL: string;
    RAISE_LOADING_ERROR: string;
    START_LOADING: string;
    START_LOADING_ALL: string;
    UPDATE_LOADING_PROGRESS: string;
    TX_SENT: string;
    WALLET_READY: string;
    NEW_COINS_LOADED: string;
    /**
     * Deactivate coin
     *
     * @event WALLETS#deactivate_coin
     * @property {string} id - Coin id.
     */
    DEACTIVATE_COIN: string;
    /**
     * Wallets updated with new data from external sources (i.e. config)
     *
     * @event WALLETS#wallets_update
     */
    UPDATE: string;
    BALANCE_UPDATED: string;
};
export declare const CONFIGS: {
    /**
     * Update config
     *
     * @event CONFIGS#update
     * @property {string} id - Config id.
     * @property {object} [options] - Custom fetch options.
     */
    UPDATE: string;
    /**
     * Config updated
     *
     * @event CONFIGS#updated
     * @property {string} id - Config id.
     * @property {Config} config - Updated config.
     */
    UPDATED: string;
    /**
     * Log settings config updated
     *
     * @event CONFIGS#log_settings_config_updated
     * @property {Config} config - Updated log settings config.
     */
    LOG_SETTINGS_UPDATED: string;
    /**
     * Failed fetch config
     *
     * @event CONFIGS#failed_fetch
     * @property {string} id - Config id.
     */
    FAILED_FETCH: string;
};
