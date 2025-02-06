export default ONTCoin;
declare const ONTCoin_base: {
    new (config: any): {
        [x: string]: any;
        "__#9@#privateKey": any;
        gasLimit: any;
        gasPrice: any;
        loadWallet(seed: any, mnemonic: any): Promise<{
            id: any;
            privateKey: any;
            address: string;
        }>;
        address: string | undefined;
        readonly feeTicker: string;
        getFee(): any | string;
        getAddress(): string;
        validateAddress(address: string): boolean;
        createTransaction({ address, amount, asset }: {
            address: any;
            amount: any;
            asset: any;
        }): Promise<string>;
        signTransaction(transaction: any): Promise<any>;
        createTokenTransaction({ address, amount, asset }: {
            address: any;
            amount: any;
            asset: any;
        }): Promise<string>;
        getPrivateKeyObject(): Promise<import("ontology-ts-sdk/lib/types/crypto").PrivateKey>;
        sendAllToMyself(asset: any): Promise<{
            txid: any;
        }>;
        checkUnbondSendTxAndRefreshBalance(): Promise<{
            balance: any;
            balances: any;
        }>;
        checkRewardAndClaim(): Promise<{
            txid: any;
        }>;
        makeClaim(): Promise<{
            txid: any;
        }>;
        getInfo(): Promise<{
            balance: any;
            balances: any;
        }>;
        balance: any;
        balances: any;
        createClaimTransaction(amount: any): Promise<string>;
        claim(): Promise<{
            txid: any;
        }>;
        setPrivateKey(privateKey: any): void;
        sendTransaction(rawtx: any): Promise<{
            txid: any;
        }>;
    };
    [x: string]: any;
};
/**
 * class for Ont coin
 *
 * @class ONTCoin
 */
declare class ONTCoin extends ONTCoin_base {
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData fee settings
     * @param {Explorer[]}  explorers list
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }: string);
    derivation: string;
    get feeWallet(): any;
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    availableBalance(): Promise<string>;
    isAvailableForFee(userFee: any): Promise<any>;
    loadTokensList(wallets: any): Promise<void>;
    createToken(args: any): ONTToken;
    getTokenList(): {
        id: any;
        name: any;
        ticker: any;
        decimal: any;
        visibility: any;
    }[];
    getFeeTicker(): any;
    getTokenTransactions(): any;
    #private;
}
import { ONTToken } from '../../tokens/index.js';
