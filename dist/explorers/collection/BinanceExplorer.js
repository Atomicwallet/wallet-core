import { ExplorerRequestError } from '../../errors/index.js';
import { TxTypes } from '../../explorers/enum/index.js';
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
import { GET_TRANSACTIONS_TYPE } from '../../utils/const/index.js';
// https://testnet-dex.binance.org/api/v1/fees
/**
 * Binance Explorer
 *
 * @abstract
 * @class {Explorer}
 */
const DECIMALS = 8;
const TX_TYPE = {
    SIDECHAIN_DELEGATE: TxTypes.STAKE,
    SIDECHAIN_UNDELEGATE: TxTypes.UNDELEGATE,
    TRANSFER: TxTypes.TRANSFER,
};
class BinanceExplorer extends Explorer {
    getAllowedTickers() {
        return ['BNB'];
    }
    async getBalance(address) {
        const { balance } = await this.request(`${this.config.baseUrl}api/v1/balances/${address}`);
        return balance;
    }
    async getAssetTransfers({ address, txArray }) {
        const multisend = [];
        const txs = txArray.reduce((acc, tx) => {
            if (Object.keys(TX_TYPE).includes(tx.txType)) {
                if (tx.hasChildren) {
                    multisend.push({ hash: tx.txHash, height: tx.blockHeight });
                    return acc;
                }
                acc.push(tx);
            }
            return acc;
        }, []);
        return {
            transactions: this.modifyTransactionsResponse(txs, address),
            multisend,
        };
    }
    async getTransactions({ address }) {
        const request = `${this.config.baseUrl}api/v1/txs?page=1&rows=100&address=${address}`;
        const transactions = await this.request(request).catch((error) => {
            throw new ExplorerRequestError({
                type: GET_TRANSACTIONS_TYPE,
                error,
                instance: this,
            });
        });
        if (transactions.txNums === 0) {
            return [];
        }
        const transfers = await this.getAssetTransfers({
            txArray: transactions.txArray,
            address,
        });
        return transfers;
    }
    modifyTransactionsResponse(txs, selfAddress) {
        if (!Array.isArray(txs)) {
            return [];
        }
        return txs.map((tx) => new Transaction({
            ticker: tx.txAsset,
            name: this.wallet.name,
            txid: this.getTxHash(tx),
            walletid: this.getTxAssetId(tx.txAsset),
            fee: this.getTxFee(tx),
            feeTicker: this.wallet.parent,
            direction: this.getTxDirection(selfAddress, tx),
            otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
            amount: this.getTxValue(selfAddress, tx),
            datetime: this.getTxDateTime(tx),
            memo: this.getTxMemo(tx),
            confirmations: this.getTxConfirmations(tx),
            txType: this.getTxType(tx),
            alias: this.wallet.alias,
        }));
    }
    getTxType({ txType = undefined }) {
        return TX_TYPE[txType] || TX_TYPE.TRANSFER;
    }
    getTxAssetId(asset) {
        if (asset === this.wallet.ticker) {
            return this.wallet.id;
        }
        const assetInstance = Object.keys(this.wallet.tokens()).find((token) => this.wallet.tokens()[token].ticker === asset);
        return this.wallet.tokens()[assetInstance].id;
    }
    getTxHash(tx) {
        return tx.txHash;
    }
    // true - incloming
    getTxDirection(selfAddress, tx) {
        if (tx.txType !== 'TRANSFER') {
            return false;
        }
        return tx.hasChildren || tx.toAddr === selfAddress;
    }
    getTxOtherSideAddress(selfAddress, tx) {
        if (tx.hasChildren) {
            return 'Multiple Addresses';
        }
        if (tx.txType !== 'TRANSFER') {
            try {
                return JSON.parse(tx.data).validatorAddress;
            }
            catch {
                return this.getTxDirection(selfAddress, tx) ? tx.fromAddr : tx.toAddr;
            }
        }
        return this.getTxDirection(selfAddress, tx) ? tx.fromAddr : tx.toAddr;
    }
    getTxValue(selfAddress, tx) {
        if (tx.value === undefined) {
            return '0';
        }
        const value = String(tx.value).replace(/(\.\d*[1-9])0+$|\.0*$/, '$1');
        let toFixed = false;
        // check if value returned in scientific notation
        if (value.search('e') !== -1) {
            toFixed = true;
        }
        return toFixed ? tx.value.toFixed(DECIMALS).replace(/(\.\d*[1-9])0+$|\.0*$/, '$1') : value;
    }
    getTxDateTime(tx) {
        return new Date(tx.timeStamp);
    }
    getTxMemo(tx) {
        return tx.memo;
    }
    getTxConfirmations(tx) {
        return tx.txAge;
    }
    getTxFee(tx) {
        return (tx && tx.txFee) || 0;
    }
}
export default BinanceExplorer;
//# sourceMappingURL=BinanceExplorer.js.map