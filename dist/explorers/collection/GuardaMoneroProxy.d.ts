export default GuardaMoneroProxy;
declare class GuardaMoneroProxy extends Explorer {
    /**
     * Gets the information about a wallet.
     *
     * @return {Promise<Object>} The information data.
     */
    getAccount(address: any): Promise<Object>;
    postAccount(address: any): Promise<any>;
    balance(address: any, viewKey: any): Promise<any>;
    random(params: any): Promise<any>;
    resync(address: any, viewKey: any): Promise<any>;
    submit({ tx, address, viewKey }: {
        tx: any;
        address: any;
        viewKey: any;
    }): Promise<any>;
    txData(hash: any): Promise<any>;
    unspent({ address, secViewKey, mixin, dustThreshold, useDust, amount }: {
        address: any;
        secViewKey: any;
        mixin: any;
        dustThreshold: any;
        useDust?: boolean | undefined;
        amount?: string | undefined;
    }): Promise<any>;
    txs(address: any, viewKey: any): Promise<any>;
    getTxHash(tx: any): any;
    getTxDirection(tx: any): boolean;
    getTxOtherSideAddress(tx: any): any;
    getTxValue(tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any, lastHeight: any): number;
    getTransactions({ address, viewKey, lastHeight }: {
        address: any;
        viewKey: any;
        lastHeight: any;
    }): Promise<any>;
    /**
     *
     * @param {Object[]} txs
     */
    modifyTransactionsResponse(selfAddress: any, response: any, lastHeight: any): any;
    getInfo({ address, viewKey }: {
        address: any;
        viewKey: any;
    }): Promise<any>;
    request(...args: any[]): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';
