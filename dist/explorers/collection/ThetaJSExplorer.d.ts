export default class ThetaJSExplorer extends Explorer {
    constructor(...args: any[]);
    /**
     * Retry init thetaJS provider each 10 seconds
     * if `new providers.HttpProvider` throws error for some reason
     *
     * @param {object} config - Configuration
     * @param {string} config.chainId - Chain ID (`mainnet` / `testnet`)
     * @param {string} config.baseUrl - Theta node JsonRPC url
     */
    initProvider({ chainId, baseUrl }?: {
        chainId: string;
        baseUrl: string;
    }): void;
    provider: any;
    getLatestBlockNumber(): Promise<any>;
    /**
     * @typedef {string} Ticker - `TFUEL`, `THETA` etc.
     * @typedef {string} Amount - In minimal units
     *
     * @typedef {object} ThetaAccount
     * @property {number} sequence - Transactions nonce
     * @property {Object.<Ticker, Amount>} coins - Balances
     * @property {boolean} emptyAddress - `true` if address is only created on paper, `false` otherwise
     */
    /**
     * @param {string} address
     * @returns {Promise<ThetaAccount>}
     */
    getAccount(address: string): Promise<{
        /**
         * - Transactions nonce
         */
        sequence: number;
        /**
         * - Balances
         */
        coins: any;
        /**
         * - `true` if address is only created on paper, `false` otherwise
         */
        emptyAddress: boolean;
    }>;
    sendTransaction(rawtx: any): Promise<{
        txid: any;
    }>;
    /**
     *
     * @param {string} providerTicker - `thetawei` / `tfuelwei`
     * @returns {string} `THETA` / `TFUEL`
     */
    getTickerFromProvider(providerTicker: string): string;
}
import Explorer from '../../explorers/explorer.js';
