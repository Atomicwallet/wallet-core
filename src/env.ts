import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (key: string) => {
  const requiredKey = getEnv(key);

  if (!requiredKey) {
    throw new Error(`[ENV]: required ${key} variable not set!`);
  }
  return requiredKey;
};

const getEnv = (key: string) => {
  return process.env[key];
};

/**
 * Config endpoints
 */
export const configurationEndpoints = {
  default: {
    CONFIGS_BASE_URL: requiredEnv('CONFIGS_BASE_URL_DEFAULT'),
    REFERRAL_PROGRAM_API_URL: requiredEnv('REFERRAL_PROGRAM_API_URL_DEFAULT'),
  },
  stage: {
    CONFIGS_BASE_URL: requiredEnv('CONFIGS_BASE_URL_STAGE'),
    REFERRAL_PROGRAM_API_URL: requiredEnv('REFERRAL_PROGRAM_API_URL_STAGE'),
  },
  dev: {
    CONFIGS_BASE_URL: requiredEnv('CONFIGS_BASE_URL_DEV'),
    REFERRAL_PROGRAM_API_URL: requiredEnv('REFERRAL_PROGRAM_API_URL_DEV'),
  },
  localhost: {
    CONFIGS_BASE_URL: 'http://localhost:9090',
    REFERRAL_PROGRAM_API_URL: 'http://localhost:9090',
  },
};

/**
 * Logger endpoint fallback
 */
export const DEFAULT_LOGGER_URL = requiredEnv('DEFAULT_LOGGER_URL');

/**
 * Fonts
 */
export const ICON_FONTS_URL = requiredEnv('ICON_FONTS_URL');

/**
 * Atomic services endpoints
 */
export const DEFAULT_SOCKET_ENDPOINT = requiredEnv('DEFAULT_SOCKET_ENDPOINT');
export const DEFAULT_CHART_DATA_ENDPOINT = requiredEnv(
  'DEFAULT_CHART_DATA_ENDPOINT',
);
export const APOLLO_SERVICE_URL = requiredEnv('APOLLO_SERVICE_URL');
export const HELPSCOUT_URL = requiredEnv('HELPSCOUT_URL');
export const TX_PUSH_SERVICE_URL = requiredEnv('TX_PUSH_SERVICE_URL');
export const MOVE_API_URL = requiredEnv('MOVE_API_URL');
export const SIMPLEX_API_URL = requiredEnv('SIMPLEX_API_URL');
export const PAYMENTS_API_URL = requiredEnv('PAYMENTS_API_URL');
export const RATES_SERVICE_URL = requiredEnv('RATES_SERVICE_URL');
export const ATOMIC_HEDERA_ACCOUNTS_SERVICE = requiredEnv(
  'ATOMIC_HEDERA_ACCOUNTS_SERVICE',
);

/**
 * EXTERNAL API
 */
export const DEFAULT_IPFS_GATEWAY = requiredEnv('DEFAULT_IPFS_GATEWAY');
export const DEFAULT_ADALITE_SUBMIT_URL = requiredEnv(
  'DEFAULT_ADALITE_SUBMIT_URL',
);
export const DEFAULT_BINANCE_NET_URL = requiredEnv('DEFAULT_BINANCE_NET_URL');
export const UNSTOPPABLEDOMAINS_API_BASE_URL = requiredEnv(
  'UNSTOPPABLEDOMAINS_API_BASE_URL',
);
export const SPACE_ID_API_BASE_URL = requiredEnv('SPACE_ID_API_BASE_URL');
export const MORALIS_NATIVE_API = requiredEnv('MORALIS_NATIVE_API');
export const TONWEB_FALLBACK_V2_URL = requiredEnv('TONWEB_FALLBACK_V2_URL');
export const TONWEB_FALLBACK_INDEX_URL = requiredEnv(
  'TONWEB_FALLBACK_INDEX_URL',
);
export const CRYPTOCOMPARE_API_URL = requiredEnv('CRYPTOCOMPARE_API_URL');
export const COINMARKETCAP_API_URL = requiredEnv('COINMARKETCAP_API_URL');
export const EVERSTAKE_API_URL = requiredEnv('EVERSTAKE_API_URL');
export const IPSTACK_API_URL = requiredEnv('IPSTACK_API_URL');

/**
 * EXTERNAL API KEYS
 */
export const CHANGENOW_FALLBACK_API_KEY = requiredEnv(
  'CHANGENOW_FALLBACK_API_KEY',
);
export const UNSTOPPABLEDOMAINS_API_KEY = requiredEnv(
  'UNSTOPPABLEDOMAINS_API_KEY',
);
export const MORALIS_API_KEY = requiredEnv('MORALIS_API_KEY');
export const TONWEB_API_KEY = requiredEnv('TONWEB_API_KEY');
export const COINMARKETCAP_API_KEY = requiredEnv('COINMARKETCAP_API_KEY');
export const EVERSTAKE_API_KEY = requiredEnv('EVERSTAKE_API_KEY');
export const PURESTAKE_EXPLORER_API_KEY = requiredEnv(
  'PURESTAKE_EXPLORER_API_KEY',
);
export const VIEWBLOCK_API_KEY = requiredEnv('VIEWBLOCK_API_KEY');
export const ETHPLORER_API_KEY = getEnv('ETHPLORER_API_KEY');
export const ETHERSCAN_API_KEY = getEnv('ETHERSCAN_API_KEY');
export const POLYSCAN_API_KEY = requiredEnv('POLYSCAN_API_KEY');
export const IPSTACK_API_KEY = requiredEnv('IPSTACK_API_KEY');
