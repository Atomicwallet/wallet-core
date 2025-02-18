export default ZILCoin;
declare const ZILCoin_base: {
    new (): {
        [x: string]: any;
        onConfirmSocketTx(tx: Object): void;
    };
    [x: string]: any;
};
declare class ZILCoin extends ZILCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, stakingContract, stakingProxyContract, id }: string, db: any, configManager: any);
    derivation: string;
    zilliqa: Zilliqa;
    balances: {};
    transactions: any[];
    tokens: {};
    nonce: number;
    setFeeData(feeData?: {}): void;
    fee: any;
    stakingProxyContract: any;
    stakingContract: any;
    stakingFeeGas: string | number | undefined;
    unstakingFeeGas: string | number | undefined;
    claimFeeGas: string | number | undefined;
    tokenFeeGas: string | number | undefined;
    sendFeeGas: string | number | undefined;
    gasLimit: string | undefined;
    gasSettings: any;
    reserveForStake: any;
    loadWallet(seed: any, phrase: any): Promise<{
        id: any;
        privateKey: any;
        address: string;
    }>;
    address: string | undefined;
    oldFormatAddressForBalance: string | undefined;
    getNonce(): number;
    getFee({ sendType, userGasPrice, gasLimit, isToken, }?: {
        sendType?: string | undefined;
        userGasPrice?: any;
        gasLimit?: string | number | undefined;
    }): Promise<any>;
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress(): string | WalletError;
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    validateAddress(address: string): boolean;
    toValidChecksumAddress(address: any): Promise<string>;
    createTransaction({ address, amount, sendType }: {
        address: any;
        amount: any;
        sendType?: string | undefined;
    }): Promise<{
        version: number;
        toAddr: any;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
    }>;
    sendTransaction(rawtx: any): Promise<any>;
    getInfo(): Promise<{
        balance: any;
        balances: {};
    }>;
    balance: any;
    setPrivateKey(privateKey: any): Promise<void>;
    changeProviders(explorers: any): void;
    balanceProvider: any;
    updateCoinParamsFromServer(data: any): void;
    createDelegationTransaction({ validator, amount }: {
        validator?: string | undefined;
        amount?: number | undefined;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    createUnDelegationTransaction({ validator, amount, gasPrice, gasLimit, }: {
        validator?: string | undefined;
        amount?: number | undefined;
        gasPrice?: any;
        gasLimit?: string | number | undefined;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    completeWithdrawal(): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    createClaimTransaction({ validator, gasPrice, gasLimit, }: {
        validator?: string | undefined;
        gasPrice?: any;
        gasLimit?: string | number | undefined;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    createTokenTransaction({ address, amount, contract }: {
        address: any;
        amount: any;
        contract: any;
    }): Promise<{
        version: number;
        toAddr: string;
        amount: any;
        gasPrice: any;
        gasLimit: Long.Long;
        nonce: number;
        pubKey: string;
        data: string;
    }>;
    /**
     * Creates a token.
     *
     * @param {...Array} args The arguments
     * @return {ETHToken}
     */
    createToken(args: any[][]): ETHToken;
    getExcludedTokenList(): never[];
    fetchUserTokens(): Promise<never[]>;
    loadTokensList(wallets: any): Promise<void>;
    getGasLimit(sendType?: string): string | number | undefined;
    getGasPrice(sendType?: string): any;
    getGasRange(sendType?: string): any;
    #private;
}
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { WalletError } from '../../errors/index.js';
import { Long } from '@zilliqa-js/util';
