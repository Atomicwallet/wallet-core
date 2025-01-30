import { TxTypes } from '../../explorers/enum/index.js';
import Explorer from '../../explorers/explorer.js';
import { toCurrency } from '../../utils/convert.js';
/**
 * @see https://mainnet-public.mirrornode.hedera.com/api/v1/docs/
 *
 * @typedef { {
 *  account: string,
 *  amount: number,
 * } } Transfer
 *
 * @typedef { 'CONSENSUSCREATETOPIC' | 'CONSENSUSDELETETOPIC' | 'CONSENSUSSUBMITMESSAGE' |
 * 'CONSENSUSUPDATETOPIC' | 'CONTRACTCALL' |
 *    'CONTRACTCREATEINSTANCE' | 'CONTRACTDELETEINSTANCE' | 'CONTRACTUPDATEINSTANCE' | 'CRYPTOADDLIVEHASH' |
 *    'CRYPTOAPPROVEALLOWANCE' |
 *    'CRYPTOCREATEACCOUNT' | 'CRYPTODELETE' | 'CRYPTODELETEALLOWANCE' | 'CRYPTODELETELIVEHASH' |
 *    'CRYPTOTRANSFER' |
 *    'CRYPTOUPDATEACCOUNT' | 'ETHEREUMTRANSACTION' | 'FILEAPPEND' | 'FILECREATE' | 'FILEDELETE' |
 *    'FILEUPDATE' | 'FREEZE' |
 *    'NODESTAKEUPDATE' | 'SCHEDULECREATE' | 'SCHEDULEDELETE' | 'SCHEDULESIGN' |
 *    'SYSTEMDELETE' | 'SYSTEMUNDELETE' | 'TOKENASSOCIATE' |
 *    'TOKENBURN' | 'TOKENCREATION' | 'TOKENDELETION' | 'TOKENDISSOCIATE' |
 *    'TOKENFEESCHEDULEUPDATE' | 'TOKENFREEZE' |
 *    'TOKENGRANTKYC' | 'TOKENMINT' | 'TOKENPAUSE' | 'TOKENREVOKEKYC' | 'TOKENUNFREEZE' |
 *    'TOKENUNPAUSE' | 'TOKENUPDATE' | 'TOKENWIPE' |
 *    'UNCHECKEDSUBMIT' | 'UNKNOWN' | 'UTILPRNG' } RawTxType
 */
const HEDERA_ACCOUNT = '0.0.98';
export default class HederaMirrorNodeExplorer extends Explorer {
    getAllowedTickers() {
        return ['HBAR'];
    }
    getApiPrefix() {
        return 'api/v1/';
    }
    getInfoUrl(address) {
        return `${this.getApiPrefix()}accounts/${address}`;
    }
    getTransactionUrl(address) {
        return `${this.getApiPrefix()}transactions/${address}`;
    }
    getTransactionsUrl() {
        return `${this.getApiPrefix()}transactions`;
    }
    getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
        return {
            'account.id': address,
            limit,
        };
    }
    getTxValue(selfAddress, tx) {
        // get positive amount from self transfer or other side transfer
        const transferGetters = [
            () => tx.staking_reward_transfers?.[0],
            () => this.#getSelfTransfer(selfAddress, tx),
            () => this.#getOtherSideTransfer(selfAddress, tx),
        ];
        for (const getTransfer of transferGetters) {
            const transfer = getTransfer();
            if (transfer?.amount > 0) {
                return toCurrency(transfer.amount, this.wallet.decimal);
            }
        }
        return toCurrency(0, this.wallet.decimal);
    }
    getTxDateTime(tx) {
        const [unix, fraction] = tx.consensus_timestamp.split('.');
        return new Date(Number(`${unix}${(fraction || '').substring(0, 3).padEnd(3, '0')}`));
    }
    getTxDirection(selfAddress, tx) {
        return this.#getSelfTransfer(selfAddress, tx)?.amount >= 0;
    }
    getTxHash(tx) {
        return tx.transaction_hash;
    }
    getTxMemo(tx) {
        return tx.memo_base64 || '';
    }
    getTxConfirmations() {
        return 1;
    }
    /**
     * @param {object} tx
     * @param {RawTxType} tx.name
     * @returns {string}
     */
    getTxType(tx) {
        if (tx.name === 'CRYPTOTRANSFER') {
            return TxTypes.TRANSFER;
        }
        if (tx.name === 'CRYPTOUPDATEACCOUNT' && tx.staking_reward_transfers?.length) {
            return TxTypes.REWARD;
        }
        return '';
    }
    getTxFee(tx) {
        return toCurrency(tx?.charged_tx_fee ?? 0, this.wallet.decimal);
    }
    getTxOtherSideAddress(selfAddress, tx) {
        return this.#getOtherSideTransfer(selfAddress, tx)?.account ?? '';
    }
    modifyInfoResponse(response) {
        return {
            balance: response.balance.balance,
            transactions: [],
        };
    }
    modifyTransactionResponse(response, selfAddress, asset = this.wallet.ticker) {
        return super.modifyTransactionResponse(response.transactions[0], selfAddress, asset);
    }
    modifyTransactionsResponse(response, selfAddress) {
        return super.modifyTransactionsResponse(response.transactions, selfAddress).filter((tx) => tx.txType);
    }
    /**
     * Finds a self transfer in the transaction.
     *
     * @param {string} selfAddress self account id
     * @param {object} tx
     * @param {Array<Transfer>} tx.transfers transaction transfer list
     * @returns {Transfer|undefined}
     */
    #getSelfTransfer(selfAddress, { transfers }) {
        return transfers.find(({ account }) => account === selfAddress);
    }
    /**
     * Finds an other-side transfer in the transaction.
     *
     * @param {string} selfAddress self account id
     * @param {object} tx
     * @param {Array<Transfer>} tx.transfers transaction transfer list
     * @param {string} tx.node tx submitter account id
     * @returns {Transfer|undefined}
     */
    #getOtherSideTransfer(selfAddress, { transfers, node }) {
        const exclude = [selfAddress, node, HEDERA_ACCOUNT];
        return transfers.find(({ account }) => !exclude.includes(account));
    }
}
//# sourceMappingURL=HederaMirrorNodeExplorer.js.map