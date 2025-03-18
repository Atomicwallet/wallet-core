export default BlockscoutExplorer;
declare class BlockscoutExplorer extends Explorer {
    request(url: any, method?: string, params?: {}, type?: string): Promise<any>;
    getTokenInfoParams(address: any): {
        module: string;
        action: string;
        address: any;
    };
    getInfoParams(address: any): {
        module: string;
        action: string;
        address: any;
    };
    getInfo(address: any): Promise<{
        balance: any;
        tokensBalances: any;
        transactions: never[];
    }>;
    getTokensInfo(tokens: any, address: any): Promise<{
        balance: any;
        tokensBalances: any;
        transactions: never[];
    }>;
    modifyInfoResponse(response: any): {
        balance: any;
        tokensBalances: any;
        transactions: never[];
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: any, limit: any): {
        module: string;
        action: string;
        address: any;
    };
    getTransferParams(address: any, offset: any, limit: any): {
        module: string;
        action: string;
        address: any;
    };
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
    }): Promise<Transaction[]>;
    modifyTokenTransactionsResponse(response: any, selfAddress: any): any;
    getTxNonce(tx: any): any;
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxConfirmations(tx: any): number;
    /**
     * Returns user token list url
     * @returns {String}
     */
    getUserTokenListUrl(address: any): string;
    modifyTokenListResponse(response: any): any;
    /**
     * Returns all token list data
     * @returns {Array}
     */
    getTokenList(): any[];
    getBannedTokensList(): Promise<never[]>;
    /**
     * Returns user token list data
     * @param {String} address
     * @returns {Array}
     */
    getUserTokenList(address: string): any[];
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
