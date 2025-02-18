import Explorer from '../../explorers/explorer.js';
/**
 * WavesNodeExplorer
 *
 * https://docs.wavesplatform.com/en/waves-api-and-sdk/waves-node-rest-api.html
 */
class WavesNodeExplorer extends Explorer {
    getAllowedTickers() {
        return ['WAVES'];
    }
    getWalletAddress() {
        return this.wallet.address;
    }
    getInfoUrl(address) {
        return `/addresses/balance/${address}`;
    }
    getInfoOptions() {
        return {
            transformResponse: [
                (data) => {
                    return JSON.parse(data.replace(/:(\d+)([,}])/g, ':"$1"$2'));
                },
            ],
        };
    }
    modifyInfoResponse(response) {
        return {
            balance: response.balance,
            transactions: this.wallet.transactions,
        };
    }
    getTransactionUrl(txId) {
        return `/transactions/info/${txId}`;
    }
    getTransactionsUrl(address) {
        return `/transactions/address/${address}/limit/${this.defaultTxLimit}`;
    }
    modifyTransactionsResponse(response, address) {
        return super.modifyTransactionsResponse(response[0].filter(({ assetId }) => assetId === null), address);
    }
    async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
        this.latestBlock = await this.getLatestBlock();
        return super.getTransactions({ address, offset, limit });
    }
    /**
     * Gets the latest block url.
     */
    getLatestBlockUrl() {
        return '/blocks/height';
    }
    getTxHash(tx) {
        return tx.id;
    }
    getTxDateTime(tx) {
        return new Date(Number(`${tx.timestamp}`));
    }
    getTxDirection(selfAddress, tx) {
        return selfAddress === tx.recipient;
    }
    getTxOtherSideAddress(selfAddress, tx) {
        return this.getTxDirection(selfAddress, tx) ? tx.sender : tx.recipient;
    }
    getTxValue(selfAddress, tx) {
        return Number(this.wallet.toCurrencyUnit(this.getTxDirection(selfAddress, tx)
            ? tx.amount
            : new this.wallet.BN(tx.amount).add(new this.wallet.BN(tx.fee))));
    }
    getTxConfirmations(tx) {
        if (this.latestBlock) {
            return this.latestBlock.height - tx.height;
        }
        return Number(1);
    }
    getSendTransactionUrl() {
        return '/transactions/broadcast';
    }
    getSendTransactionParams(rawtx) {
        return JSON.parse(rawtx);
    }
    modifySendTransactionResponse(response) {
        return {
            txid: response.id,
        };
    }
    getTxFee(tx) {
        return this.wallet.toCurrencyUnit((tx && tx.fee) || 0);
    }
}
export default WavesNodeExplorer;
//# sourceMappingURL=WavesNodeExplorer.js.map