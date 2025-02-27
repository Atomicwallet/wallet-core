import BN from 'bn.js';
import { AbstractWallet, type Coin } from '../abstract/index.js';
import Transaction, { TransactionInfoFields } from '../explorers/Transaction.js';
import { GetFeeArgs } from '../utils/index.js';
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
    constructor(args: TokenCreationArgs, db?: IDataBase, configManager?: IConfigManager);
    get id(): string;
    protected set id(id: string);
    get contract(): string;
    protected set contract(contract: string);
    get address(): string;
    get network(): string;
    get networkType(): string;
    get feeWallet(): Coin;
    get feeTicker(): string;
    /**
     * Should be removed
     */
    get deprecatedParent(): string;
    get parentTicker(): string;
    get txWebUrl(): string;
    get coreLibrary(): unknown;
    /**
     * Determines token custom source
     */
    get isCustom(): boolean;
    getWebTransactionUrl(id: string): string;
    getTxLimit(): number | undefined;
    loadWallet(mnemonic: string): Promise<this>;
    validateAddress(address: string): Promise<void>;
    createTransaction(args: CreateTxParams): Promise<RawTxHex | RawTxBinary | RawTxObject>;
    createRawTransactions(args: CreateTxParams): Promise<string | object | RawTxBinary>;
    sendTransaction(args: RawTxHex | RawTxObject | RawTxBinary): Promise<unknown>;
    getInfo(): Promise<{
        balance: string | null;
    }>;
    availableBalance(): Promise<string>;
    isAvailableForFee(fee: string): Promise<boolean | undefined>;
    getFee(args: Partial<GetFeeArgs>): Promise<BN>;
    getGasPrice(withoutCoefficient: boolean, isToken?: boolean): Promise<BN | number | string>;
    estimateGas(amount: BN | string, address: string, contract: string, defaultGas?: BN | string | number): Promise<BN | number | string>;
    getTokenTransactions(): Promise<Transaction[]>;
    getTransactions(offset: number, limit: number): Promise<Transaction[]>;
    checkTransaction(args: TransactionInfoFields): Promise<void>;
    getTransaction(txId: TxHash): Promise<object | undefined>;
    /**
     * Update dynamic data set
     */
    updateTokenParamsFromServer(data: CoinConfigType): void;
    isTagShown(): boolean;
    manageEvents(): void;
    removeTokenFromDb(args: object[]): void;
}
