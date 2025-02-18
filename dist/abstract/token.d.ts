import BN from 'bn.js';
import { AbstractWallet, type Coin } from '../abstract/index.js';
import type Transaction from '../explorers/Transaction.js';
import { IConfigManager } from '../utils/configManager/index.js';
import { IDataBase } from '../utils/db/index.js';
import type { CreateTxParams, RawTxBinary, RawTxHex, RawTxObject, TxHash, TokenCreationArgs, TokenSource, CoinConfigType } from './index.js';
export default abstract class Token extends AbstractWallet {
    #private;
    confirmed: boolean;
    visibility: boolean;
    source: TokenSource;
    config?: CoinConfigType;
    uniqueField: string;
    BN: typeof BN;
    fields: {
        paymentId: boolean;
    };
    transactions: Transaction[];
    isSetBalance: boolean;
    notify: boolean;
    /**
     * Constructs a new instance of the class.
     */
    constructor(args: TokenCreationArgs, db?: IDataBase, configManager?: IConfigManager);
    get id(): string;
    protected set id(id: string);
    get contract(): string;
    protected set contract(contract: string);
    /**
     * Address
     */
    get address(): string;
    /**
     * Token network
     */
    get network(): string;
    get networkType(): string;
    /**
     * Get fee wallet instance
     */
    get feeWallet(): Coin;
    get feeTicker(): string;
    /**
     * Should be removed
     */
    get deprecatedParent(): string;
    get parentTicker(): string;
    /**
     * Transaction base url
     */
    get txWebUrl(): string;
    /**
     * Parent corelib
     */
    get coreLibrary(): unknown;
    /**
     * Determines token custom source
     */
    get isCustom(): boolean;
    getWebTransactionUrl(id: string): string;
    getTxLimit(): number | undefined;
    /**
     * Gets the wallet.
     */
    loadWallet(mnemonic: string): Promise<this>;
    /**
     * Validates wallet address
     */
    validateAddress(address: string): Promise<void>;
    createTransaction(args: CreateTxParams): Promise<RawTxHex | RawTxBinary | RawTxObject>;
    createRawTransactions(args: CreateTxParams): Promise<string | object | RawTxBinary>;
    sendTransaction(args: RawTxHex | RawTxObject | RawTxBinary): Promise<unknown>;
    /**
     * Gets the information about a wallet.
     */
    getInfo(): Promise<{
        balance: string | null;
    }>;
    /**
     * Gets the available balance.
     */
    availableBalance(): Promise<string>;
    isAvailableForFee(fee: string): Promise<boolean | undefined>;
    /**
     * Gets the fee.
     *
     * @param {String} amount Amount to transfer in satoshis
     * @param {Boolean} isSendAll
     * @param {String} userGasPrice optional custom gas price
     * @param {String} userGasLimit optional custom gas limit
     * @return {Promise<BN>} The fee big number
     */
    getFee(args: any): Promise<BN>;
    getGasPrice(withoutCoefficient: boolean, isToken?: boolean): Promise<BN | number | string>;
    estimateGas(amount: BN | string, address: string, contract: string, defaultGas?: BN | string | number): Promise<BN | number | string>;
    getTokenTransactions(): Promise<Transaction[]>;
    getTransactions(offset: number, limit: number): Promise<Transaction[]>;
    checkTransaction(args: any): Promise<void>;
    getTransaction(txId: TxHash): Promise<object | undefined>;
    /**
     * Update dynamic data set
     */
    updateTokenParamsFromServer(data: CoinConfigType): void;
    isTagShown(): boolean;
    manageEvents(): void;
    /**
     * isActivated getter
     * Allows to determine if a token is activated.
     */
    get isActivated(): undefined;
    /**
     * Activates token
     * Also activates the parent coin and all associated tokens.
     */
    activate(): Promise<void>;
    /**
     * Deactivates token
     * Also deactivates the parent coin and all associated tokens.
     */
    deactivate(): void;
    removeTokenFromDb(args: object[]): void;
}
