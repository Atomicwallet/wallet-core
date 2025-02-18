export default DogeChainExplorer;
declare class DogeChainExplorer extends Explorer {
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
    /**
     * Gets a balance from a wallet info.
     *
     * @return {Promise<String>}
     */
    getBalance(): Promise<string>;
    modifyUnspentOutputsResponse(response: any): any;
    /**
     * Calculates the balance.
     *
     * @param {Object[]} utxos The utxos
     * @return {BN} The balance.
     */
    calculateBalance(utxos?: Object[]): BN;
}
import Explorer from '../../explorers/explorer.js';
