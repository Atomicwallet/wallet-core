export declare const ONE_MINUTE = 60000;
export declare const GET_TRANSACTIONS_TYPE = "GetTxs";
export declare const GET_TOKENS_TYPE = "GetTkns";
export declare const GET_TRANSACTION_TYPE = "GetTx";
export declare const SEND_TRANSACTION_TYPE = "Send";
export declare const GET_UTXO_TYPE = "UTXO";
export declare const GET_LATEST_BLOCK_TYPE = "GetLatestBlock";
export declare const GET_BLOCK_TYPE = "GetBlockType";
export declare const GET_BALANCE_TYPE = "Balance";
export declare const INTERNAL_ERROR = "Internal";
export declare const EXTERNAL_ERROR = "External";
export declare const WALLET_ERROR = "Wallet internal error";
export declare const UNDEFINED_OPERATION_ERROR = "Undefined operation";
export declare const LOAD_WALLET_ERROR = "LoadWallet";
export declare const EXPLORER_API_ERROR = "Explorer Api request error";
export declare const PUBLIC_KEY_TO_ADDRESS_ERROR = "can't get address from public key from method: history/get_key_accounts, node: ";
export declare const LOCAL_ENV_CONFIG = "LocalEnvConfig";
export declare const HTTP_STATUS_OK = 200;
export declare const HTTP_STATUS_BAD_REQUEST = 400;
export declare const HTTP_STATUS_NOT_FOUND = 404;
export declare const HTTP_STATUS_SERVER_ERROR = 500;
export declare const BTC_MOCK_ADDR = "1LTcbL8h7xcWrJoDs4rcrEgpHMJ9TgsriS";
export declare const ATOM_MSG_TYPES: {
    Send: string;
    Delegate: string;
    Undelegate: string;
    Withdraw: string;
    Redelegate: string;
};
export declare const STAKE_ADDR_TYPE = "stakeAddr";
export declare const BUY_SETTINGS: {
    availableWallets: {
        ticker: string;
        id: string;
    }[];
    fiats: {
        USD: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        EUR: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        CAD: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        JPY: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        RUB: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        AUD: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        KRW: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        CHF: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        CZK: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        DKK: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        NOK: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        NZD: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        PLN: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        SEK: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        TRY: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        ZAR: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        HUF: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
        ILS: {
            min: number;
            max: number;
            default: number;
            fee: number;
        };
    };
    simplexTickers: {
        'AXS-ERC20': string;
    };
};
export declare const STAKING_SETTINGS_DEFAULT: ({
    ticker: string;
    displayTicker: string;
    name: string;
    reward: number;
    defaultValidator: string;
    platforms: string[];
    tags: never[];
} | {
    ticker: string;
    displayTicker: string;
    name: string;
    reward: number;
    platforms: string[];
    defaultValidator?: undefined;
    tags?: undefined;
} | {
    ticker: string;
    displayTicker: string;
    name: string;
    reward: number;
    defaultValidator: string;
    platforms: string[];
    tags?: undefined;
})[];
export declare const TxEventTypes: string[];
export declare const IcxTxTypes: {
    TXTYPE_STAKE: string;
    TXTYPE_DELEGATE: string;
    TXTYPE_CLAIM: string;
};
export declare const REVIEW_SETTINGS_DEFAULT: {
    selectTitle: string;
    selectValues: string[];
};
export declare const LIB_NAME_INDEX: {
    BITCORE: string;
    BITCOINJS: string;
    BITGO: string;
};
export declare const PARAMETER_UPDATE_COINS_INTERVAL = 300000;
