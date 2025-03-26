export const ONE_MINUTE = 60000;

export const GET_TRANSACTIONS_TYPE = 'GetTxs';
export const GET_TOKENS_TYPE = 'GetTkns';
export const GET_TRANSACTION_TYPE = 'GetTx';
export const SEND_TRANSACTION_TYPE = 'Send';
export const GET_UTXO_TYPE = 'UTXO';
export const GET_LATEST_BLOCK_TYPE = 'GetLatestBlock';
export const GET_BLOCK_TYPE = 'GetBlockType';
export const GET_BALANCE_TYPE = 'Balance';
export const INTERNAL_ERROR = 'Internal';
export const EXTERNAL_ERROR = 'External';
export const WALLET_ERROR = 'Wallet internal error';
export const UNDEFINED_OPERATION_ERROR = 'Undefined operation';
export const LOAD_WALLET_ERROR = 'LoadWallet';
export const EXPLORER_API_ERROR = 'Explorer Api request error';

export const PUBLIC_KEY_TO_ADDRESS_ERROR =
  "can't get address from public key from method: history/get_key_accounts, node: ";

export const LOCAL_ENV_CONFIG = 'LocalEnvConfig';

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_SERVER_ERROR = 500;

export const BTC_MOCK_ADDR = '1LTcbL8h7xcWrJoDs4rcrEgpHMJ9TgsriS';

export const ATOM_MSG_TYPES = {
  Send: 'cosmos-sdk/MsgSend',
  Delegate: 'cosmos-sdk/MsgDelegate',
  Undelegate: 'cosmos-sdk/MsgUndelegate',
  Withdraw: 'cosmos-sdk/MsgWithdrawDelegationReward',
  Redelegate: 'cosmos-sdk/MsgBeginRedelegate',
};

export const STAKE_ADDR_TYPE = 'stakeAddr';

export const BUY_SETTINGS = {
  availableWallets: [
    {
      ticker: 'btc',
      id: 'btc',
    },
    {
      ticker: 'eth',
      id: 'eth',
    },
    {
      ticker: 'xrp',
      id: 'xrp',
    },
    {
      ticker: 'ltc',
      id: 'ltc',
    },
    {
      ticker: 'bch',
      id: 'bch',
    },
    {
      ticker: 'xlm',
      id: 'xlm',
    },
    {
      ticker: 'trx',
      id: 'trx',
    },
    {
      ticker: 'qtum',
      id: 'qtum',
    },
    {
      ticker: 'dgb',
      id: 'dgb',
    },
    {
      ticker: 'bnb',
      id: 'bnb',
    },
    {
      ticker: 'dash',
      id: 'dash',
    },
    {
      ticker: 'atom',
      id: 'atom',
    },
    {
      ticker: 'nano',
      id: 'nano',
    },
    {
      ticker: 'icx',
      id: 'icx',
    },
    {
      ticker: 'xem',
      id: 'xem',
    },
    {
      ticker: 'axs',
      id: '47ce2dcfd80abaa35678d018e7a3cfa3',
    },
  ],
  fiats: {
    USD: { min: 50, max: 20000, default: 200, fee: 10 },
    EUR: { min: 50, max: 18700, default: 200, fee: 10 },
    CAD: { min: 79, max: 26337, default: 200, fee: 15 },
    JPY: { min: 6553, max: 2183334, default: 26500, fee: 1100 },
    RUB: { min: 3851, max: 1283158, default: 12000, fee: 630 },
    AUD: { min: 89, max: 29745, default: 300, fee: 15 },
    KRW: { min: 69615, max: 23193398, default: 230000, fee: 11750 },
    CHF: { min: 58, max: 19380, default: 200, fee: 10 },
    CZK: { min: 1368, max: 455772, default: 4500, fee: 330 },
    DKK: { min: 607, max: 202099, default: 2000, fee: 85 },
    NOK: { min: 911, max: 303448, default: 3000, fee: 90 },
    NZD: { min: 95, max: 31564, default: 300, fee: 20 },
    PLN: { min: 233, max: 77521, default: 800, fee: 40 },
    SEK: { min: 608, max: 202499, default: 2000, fee: 90 },
    TRY: { min: 366, max: 121779, default: 1200, fee: 65 },
    ZAR: { min: 930, max: 309845, default: 3100, fee: 160 },
    HUF: { min: 20575, max: 6854771, default: 68000, fee: 3395 },
    ILS: { min: 202, max: 67166, default: 600, fee: 40 },
  },
  simplexTickers: {
    'AXS-ERC20': 'AXS',
  },
};

export const STAKING_SETTINGS_DEFAULT = [
  {
    ticker: 'NEAR',
    displayTicker: 'NEAR',
    name: 'NearProtocol',
    reward: 7.4,
    defaultValidator: 'LunaNova',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
    tags: [],
  },
  {
    ticker: 'SOL',
    displayTicker: 'SOL',
    name: 'Solana',
    reward: 7.4,
    defaultValidator: 'AtomicWallet',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
    tags: [],
  },
  {
    ticker: 'ZIL',
    displayTicker: 'ZIL',
    name: 'Zilliqa',
    reward: 20,
    defaultValidator: 'AtomicWallet',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
    tags: [],
  },
  {
    ticker: 'ADA',
    displayTicker: 'ADA',
    name: 'Cardano',
    reward: 5,
    defaultValidator: 'Atomic Wallet',
    platforms: ['desktop2.24.0', 'ios0.68.0', 'android0.68.0'],
    tags: [],
  },
  {
    ticker: 'AWC-986',
    displayTicker: 'AWC',
    name: 'Atomic Wallet Token',
    reward: 20,
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'DOT',
    displayTicker: 'DOT',
    name: 'Polkadot',
    reward: 10,
    platforms: ['desktop2.25.0', 'ios0.69.0', 'android0.69.0'],
  },
  {
    ticker: 'ICX',
    displayTicker: 'ICX',
    name: 'Icon',
    reward: 10,
    defaultValidator: 'Atomic Wallet',
    platforms: ['desktop2.24.0', 'ios0.68.0', 'android0.68.0'],
    tags: [],
  },
  {
    ticker: 'ATOM',
    displayTicker: 'Atom',
    name: 'Cosmos',
    reward: 10,
    defaultValidator: 'Everstake',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'XTZ',
    displayTicker: 'XTZ',
    name: 'Tezos',
    reward: 7,
    defaultValidator: 'Everstake',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'TRX',
    displayTicker: 'TRX',
    name: 'Tron',
    reward: 5,
    defaultValidator: 'Binance',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'BAND',
    displayTicker: 'BAND',
    name: 'Band Protocol',
    reward: 17,
    defaultValidator: 'Everstake',
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'NEO',
    displayTicker: 'NEO - GAS',
    name: 'NEO',
    reward: 1.4,
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'KMD',
    displayTicker: 'KMD',
    name: 'Komodo',
    reward: 5.1,
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'ALGO',
    displayTicker: 'ALGO',
    name: 'ALgorand',
    reward: 5.6,
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'VET',
    displayTicker: 'VET - VTHO',
    name: 'Vechain',
    reward: 1.63,
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
  {
    ticker: 'BNB',
    displayTicker: 'BNB',
    name: 'Binance chain',
    reward: 4,
    platforms: ['desktop2.22.0', 'ios0.66.0', 'android0.66.0'],
  },
];

export const TxEventTypes = [
  'receive',
  'confirm',
  'confirm::reward',
  'confirm::freeze',
  'confirm::unfreeze',
  'confirm::vote',
];

export const IcxTxTypes = {
  TXTYPE_STAKE: '13',
  TXTYPE_DELEGATE: '14',
  TXTYPE_CLAIM: '15',
};

export const REVIEW_SETTINGS_DEFAULT = {
  selectTitle: 'Select subject',
  selectValues: [
    'Balance issue',
    'Transaction issue (deposit/withdrawal)',
    'Exchange',
    'Buy Crypto',
    'Staking',
    'Fee question',
    'Backup and Recovery',
    'Cashback/Membership/AWC staking rewards',
    'Report a Bug, Security issue, or Scam',
    'General question',
    'Feature/Coin request',
    'Other issues',
  ],
};

export const LIB_NAME_INDEX = {
  BITCORE: 'bitcore',
  BITCOINJS: 'bitcoinJs',
  BITGO: 'bitgo',
};

export const PARAMETER_UPDATE_COINS_INTERVAL = 300000;
