import TronscanClient from '@tronscan/client';
import { ExplorerRequestError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
import { getTokenId } from '../../utils/index.js';
import { SEND_TRANSACTION_TYPE } from '../../utils/const/index.js';
const TRON_CONTRACT_TYPES = {
    AccountCreateContract: 0,
    TransferContract: 1,
    TransferAssetContract: 2,
    VoteAssetContract: 3,
    VoteWitnessContract: 4,
    WitnessCreateContract: 5,
    AssetIssueContract: 6,
    WitnessUpdateContract: 8,
    ParticipateAssetIssueContract: 9,
    AccountUpdateContract: 10,
    FreezeBalanceContract: 11,
    UnfreezeBalanceContract: 12,
    WithdrawBalanceContract: 13,
    UnfreezeAssetContract: 14,
    UpdateAssetContract: 15,
    ProposalCreateContract: 16,
    ProposalApproveContract: 17,
    ProposalDeleteContract: 18,
    SetAccountIdContract: 19,
    CustomContract: 20,
    // BuyStorageContract: 21,
    // BuyStorageBytesContract: 22,
    // SellStorageContract: 23,
    CreateSmartContract: 30,
    TriggerSmartContract: 31,
    GetContract: 32,
    UpdateSettingContract: 33,
    ExchangeCreateContract: 41,
    ExchangeInjectContract: 42,
    ExchangeWithdrawContract: 43,
    ExchangeTransactionContract: 44,
    UpdateEnergyLimitContract: 45,
    AccountPermissionUpdateContract: 46,
    PermissionAddKeyContract: 47,
    PermissionUpdateKeyContract: 48,
    PermissionDeleteKeyContract: 49,
    FreezeBalanceV2Contract: 54,
    UnfreezeBalanceV2Contract: 55,
};
const TX_LIMIT = 50;
/**
 * Class for tronscan explorer.
 *
 */
class TronscanExplorer extends Explorer {
    constructor(...args) {
        super(...args);
        this.httpclient = new TronscanClient.Client(this.config.baseUrl.replace('/api/', ''));
        this.helper = TronscanClient;
        this.defaultTxLimit = TX_LIMIT;
        // global timeouts for Tronscan requests
        this.client.interceptors.request.use((config) => {
            config.timeout = 10000; // 10 second
            return config;
        });
    }
    getAllowedTickers() {
        return ['TRX', 'BTT', 'WIN', 'USDC', 'BTTOLD'];
    }
    /**
     * Gets the information url.
     *
     * @return {<type>} The information url.
     */
    getInfoUrl(address) {
        return `account?address=${address}`;
    }
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
        return { start: offset, limit };
    }
    /**
     * Modify information response
     *
     * @return {Object} { description_of_the_return_value }
     */
    modifyInfoResponse(response) {
        return {
            balance: String(response.balance),
            assets: response.trc20token_balances,
        };
    }
    getAccount(address) {
        return this.request(`account?address=${address}`);
    }
    getVotes(address) {
        return this.request(`vote?voter=${address}`);
    }
    /**
     * Gets the transaction url.
     *
     * @param  {<type>} txId The transmit identifier
     * @return {<type>} The transaction url.
     */
    getTransactionUrl(txId) {
        return `transaction-info?hash=${txId}`;
    }
    /**
     * Gets the latest block url.
     */
    getLatestBlockUrl() {
        return 'block/latest';
    }
    /**
     * Gets the transactions.
     *
     * @param  {number} offset The offset (default: 0)
     * @param  {<type>} limit The limit (default: this.defaultTxLimit)
     * @return {Promise} The transactions.
     */
    async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
        this.latestBlock = await this.getLatestBlock();
        return super.getTransactions({ address, offset, limit });
    }
    /**
     * Gets the transactions url.
     *
     * @return {<type>} The transactions url.
     */
    getTransactionsUrl(address) {
        return `transaction?sort=-timestamp&address=${address}`;
    }
    /**
     * Modify transactions response
     *
     * @return {<type>} { description_of_the_return_value }
     */
    modifyTransactionsResponse(response, address, asset = this.wallet.ticker) {
        const transfers = response.data.filter((tx) => tx.tokenInfo?.tokenAbbr !== 'trx');
        const transactions = response.data
            .filter((tx) => (tx.tokenInfo?.tokenAbbr === 'trx' && [tx.ownerAddress, tx.toAddress].includes(address)) ||
            this.getTransactionType(tx) === 'vote' ||
            (this.getTransactionType(tx) === 'regular' && tx.amount === '0'))
            .map((tx) => {
            return this.getTransaction(address, tx, this.getBatchTxValue(address, tx), asset, this.wallet.id, this.wallet.name);
        });
        return { transactions, transfers };
    }
    modifyTransactionResponse(tx, address, asset = this.wallet.ticker) {
        return this.getTransaction(address, tx, this.getTxValue(address, tx), this.wallet.ticker, this.wallet.id, this.wallet.name);
    }
    modifyTokenTransactionResponse(tx, address, asset, decimal) {
        return this.getTransaction(address, tx, this.getTxValue(address, tx, decimal), asset, getTokenId({
            ticker: asset,
            contract: tx.tokenName,
            parent: this.wallet.parent,
        }));
    }
    /**
     * Gets the send transaction url.
     */
    getSendTransactionUrl() {
        return 'broadcast';
    }
    /**
     * Gets the send transaction parameter.
     */
    getSendTransactionParam() {
        return 'transaction';
    }
    /**
     * Modify send transaction response
     *
     * @return {Object} { description_of_the_return_value }
     */
    modifySendTransactionResponse(response) {
        if (response.data.code !== 'SUCCESS') {
            throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error: response.data.message,
                instance: this,
            });
        }
        return {
            txid: this.lastSendingTransactionHash,
        };
    }
    /**
     * Sends a transaction.
     *
     * @param  {<type>} rawtx The rawtx
     * @return {Promise} { description_of_the_return_value }
     */
    async sendTransaction(rawtx, pk) {
        try {
            this.httpclient.apiUrl = this.config.baseUrl.replace('/api/', '');
            await this.httpclient.sendTransaction(pk, rawtx);
            return {
                txid: this.SHA256(rawtx.getRawData().serializeBinary()),
            };
        }
        catch (error) {
            throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error,
                instance: this,
            });
        }
    }
    /**
     * Gets a balance from a wallet info.
     *
     * @return {Promise<String>} The balance.
     */
    async getBalance() {
        const info = await this.getInfo();
        return this.wallet.toCurrencyUnit(info.balance);
    }
    /**
     * Gets the transmit hash.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit hash.
     */
    getTxHash(tx) {
        return tx.hash;
    }
    /**
     * Gets the transmit direction.
     *
     * @param  {<type>} tx The transmit
     * @return {<Boolean>} The transmit direction.
     */
    getTxDirection(selfAddress, tx) {
        if (tx.contractType === TRON_CONTRACT_TYPES.FreezeBalanceContract &&
            tx.ownerAddress.toLowerCase() === selfAddress.toLowerCase()) {
            return false;
        }
        return (tx.toAddress.toLowerCase() === selfAddress.toLowerCase() ||
            (tx.toAddress === '' && tx.ownerAddress.toLowerCase() === selfAddress.toLowerCase()));
    }
    /**
     * Gets the transmit recipient.
     *
     * @param selfAddress <String> Address
     * @param tx <Object> The transmit
     * @return <String> The transmit recipient.
     */
    getTxOtherSideAddress(selfAddress, tx) {
        switch (tx.contractType) {
            case TRON_CONTRACT_TYPES.FreezeBalanceContract:
                return 'Freeze 1.0';
            case TRON_CONTRACT_TYPES.FreezeBalanceV2Contract:
                return 'Freeze 2.0';
            case TRON_CONTRACT_TYPES.UnfreezeBalanceContract:
            case TRON_CONTRACT_TYPES.UnfreezeAssetContract:
                return 'Unfreeze 1.0';
            case TRON_CONTRACT_TYPES.WithdrawBalanceContract:
                return 'Reward';
            case TRON_CONTRACT_TYPES.TransferContract:
            default:
                return tx.toAddress.toLowerCase() === selfAddress.toLowerCase() ? tx.ownerAddress : tx.toAddress;
        }
    }
    /**
     * Gets the transmit value.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit value.
     */
    getBatchTxValue(selfAddress, tx, decimal = this.wallet.decimal) {
        return this.getTransactionType(tx) === 'vote' ? tx.amount : this.wallet.toCurrencyUnit(tx.amount, decimal);
    }
    getTxValue(selfAddress, tx, decimal = this.wallet.decimal) {
        switch (tx.contractType) {
            case TRON_CONTRACT_TYPES.FreezeBalanceContract:
                return 'Freeze';
            case TRON_CONTRACT_TYPES.UnfreezeBalanceContract:
            case TRON_CONTRACT_TYPES.UnfreezeAssetContract:
            case TRON_CONTRACT_TYPES.UnfreezeBalanceV2Contract:
                return this.wallet.toCurrencyUnit(tx.info.unfreeze_amount, decimal);
            case TRON_CONTRACT_TYPES.WithdrawBalanceContract:
                return 'Reward';
            case TRON_CONTRACT_TYPES.TransferContract:
            default:
                return this.wallet.toCurrencyUnit(tx.amount, decimal);
        }
    }
    /**
     * Gets the transmit date time.
     *
     * @param  {<type>} tx The transmit
     * @return {Date} The transmit date time.
     */
    getTxDateTime(tx) {
        return new Date(Number(tx.timestamp));
    }
    /**
     * Gets the transmit confirmations.
     *
     * @param  {<type>} tx The transmit
     * @return {<type>} The transmit confirmations.
     */
    getTxConfirmations(tx) {
        if (this.latestBlock) {
            return this.latestBlock.number - tx.block;
        }
        return Number(tx.confirmed);
    }
    SHA256(msgBytes) {
        const shaObj = new TronscanClient.sha256('SHA-256', 'HEX');
        const msgHex = TronscanClient.bytes.byteArray2hexStr(msgBytes);
        shaObj.update(msgHex);
        return shaObj.getHash('HEX');
    }
    getTokenTransfers(address, limit = 10) {
        return this.request(`token_trc20/transfers?limit=${limit}&start=0&sort=-timestamp&count=false&relatedAddress=${address}`);
    }
    getTxFee(tx) {
        return this.wallet.toCurrencyUnit(tx?.cost?.fee || this.wallet.feeDefault);
    }
    getTransaction(address, tx, amount, ticker, walletid, name) {
        return new Transaction({
            alias: this.wallet.alias,
            amount,
            confirmations: this.getTxConfirmations(tx),
            datetime: this.getTxDateTime(tx),
            direction: this.getTxDirection(address, tx),
            fee: this.getTxFee(tx),
            feeTicker: this.wallet.parent,
            memo: this.getTxMemo(tx),
            name,
            otherSideAddress: this.getTxOtherSideAddress(address, tx),
            ticker,
            txid: this.getTxHash(tx),
            txType: this.getTransactionType(tx),
            walletid,
        });
    }
    getTransactionInfo(txId) {
        return this.request(`transaction-info?hash=${txId}`);
    }
    getTransactionType({ contractType }) {
        const typesMap = {
            freeze: [TRON_CONTRACT_TYPES.FreezeBalanceContract],
            reward: [TRON_CONTRACT_TYPES.WithdrawBalanceContract, TRON_CONTRACT_TYPES.ExchangeWithdrawContract],
            unstake: [
                TRON_CONTRACT_TYPES.UnfreezeBalanceContract,
                TRON_CONTRACT_TYPES.UnfreezeAssetContract,
                TRON_CONTRACT_TYPES.UnfreezeBalanceV2Contract,
            ],
            vote: [TRON_CONTRACT_TYPES.VoteAssetContract, TRON_CONTRACT_TYPES.VoteWitnessContract],
        };
        for (const txType of Object.keys(typesMap)) {
            if (typesMap[txType].includes(contractType)) {
                return txType;
            }
        }
        return 'regular';
    }
    async isFirstTransfer(to) {
        const { token_transfers: transfers } = await this.getTokenTransfers(to, 1);
        return !transfers.length;
    }
}
export default TronscanExplorer;
//# sourceMappingURL=TronscanExplorer.js.map