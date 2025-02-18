import { ExplorerRequestError } from '../../errors/index.js';
import Explorer from '../../explorers/explorer.js';
import { CosmosNodeTransactionTypeMixin } from '../../explorers/mixins/index.js';
import validators from '../../resources/staking/validators.json';
import { SEND_TRANSACTION_TYPE, EXTERNAL_ERROR } from '../../utils/const/index.js';
const DEFAULT_TX_LIMIT = 50;
class CosmosNodeExplorer extends CosmosNodeTransactionTypeMixin(Explorer) {
    /**
     * Constructs the object.
     *
     * @param {Coin|Token} wallet The wallet
     * @param {String} baseUrl The base url
     * @param {String} webUrl The web url
     */
    constructor() {
        super(...arguments);
        this.defaultTxLimit = DEFAULT_TX_LIMIT;
        this.canPaginate = true;
        this.lastKnownHeight = 0;
        const currency = validators.find((validator) => validator.currency === this.wallet.ticker);
        this.validatorMoniker = {};
        currency.validators.forEach((validator) => {
            this.validatorMoniker[validator.address] = validator.name;
        });
    }
    getAllowedTickers() {
        return ['ATOM', 'BAND'];
    }
    async request() {
        const response = await super.request(...arguments);
        if (response && response.height && this.lastKnownHeight < Number(response.height)) {
            this.lastKnownHeight = response.height;
        }
        if (response && response.result) {
            return response.result;
        }
        return response;
    }
    async getAuth(address) {
        const response = await this.request(`auth/accounts/${address}`);
        if (response && response.value && response.value.account_number === '0') {
            throw new ExplorerRequestError({
                type: EXTERNAL_ERROR,
                error: new Error(JSON.stringify(response)),
                instance: this,
            });
        }
        return response && response.value;
    }
    getLatestBlockUrl() {
        return 'blocks/latest';
    }
    getSendTransactionUrl() {
        return 'txs';
    }
    getSendTransactionParams(rawtx) {
        return rawtx;
    }
    modifySendTransactionResponse(response) {
        if (response.code) {
            throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error: new Error(response.raw_log),
                instance: this,
            });
        }
        return {
            txid: response.txhash,
        };
    }
    async sendDelegationTransaction(address, rawtx) {
        const response = await this.request(`staking/delegators/${address}/delegations`, 'post', rawtx);
        if (response.value && response.value.account_number === '0') {
            throw new ExplorerRequestError({
                type: SEND_TRANSACTION_TYPE,
                error: new Error(response),
                instance: this,
            });
        }
        return response.value;
    }
    async getTransactionRewardsBlueprint({ from, gas, gas_adjustment = '1.2', fee, chain_id, denom = 'uatom' }) {
        const response = await this.request(`distribution/delegators/${from}/rewards`, 'post', {
            base_req: {
                from,
                chain_id,
                gas,
                gas_adjustment,
                fees: [
                    {
                        denom,
                        amount: fee,
                    },
                ],
                simulate: false,
            },
        });
        return response.value;
    }
    async getTransaction(selfAddress, txid) {
        const tx = await this.request(`txs/${txid}`);
        return this.modifyTransactionResponse(tx, selfAddress);
    }
    async getTransactions({ address, limit, pageNum }) {
        // cosmosNodeRpc requires pages > 0
        pageNum += 1;
        const [sent, received] = await Promise.all([
            this.request(`txs?message.sender=${address}&message.action=send&page=${pageNum}&limit=${limit}`),
            this.request(`txs?transfer.recipient=${address}&message.action=send&page=${pageNum}&limit=${limit}`),
        ]);
        const receivedHashes = received.txs.map((tx) => tx.txhash);
        const uniqSent = sent.txs.filter((tx) => {
            return !receivedHashes.includes(tx.txhash);
        });
        received.txs.forEach((tx) => {
            tx.direction = true;
        });
        uniqSent.forEach((tx) => {
            tx.direction = false;
        });
        const txs = received.txs.concat(uniqSent).sort((tx1, tx2) => {
            if (Number(tx1.height) < Number(tx2.height)) {
                return 1;
            }
            return -1;
        });
        await this.getLatestBlock();
        return this.modifyTransactionsResponse(txs, address);
    }
    getTxValue(selfAddress, tx) {
        const msgAmount = tx.tx.value.msg[0].value.amount;
        const value = Array.isArray(msgAmount) ? msgAmount[0].amount : msgAmount.amount;
        return this.wallet.toCurrencyUnit(value);
    }
    /**
     * Gets the transaction direction.
     *
     * @param {Object} tx The transaction
     * @return {Boolean} The transaction direction.
     */
    getTxDirection(selfAddress, tx) {
        return String(tx.tx.value.msg[0].value.to_address).toLowerCase() === selfAddress.toLowerCase();
    }
    /**
     * Gets the transaction recipient.
     *
     * @param {Object} tx The transaction response.
     * @return {(Boolean|String)} The transaction recipient.
     */
    getTxOtherSideAddress(selfAddress, tx) {
        if (this.getTxDirection(selfAddress, tx)) {
            return tx.tx.value.msg[0].value.from_address;
        }
        return tx.tx.value.msg[0].value.to_address;
    }
    /**
     * Gets the transaction datetime.
     *
     * @param {Object} tx The transaction response
     * @return {Date} The transaction datetime.
     */
    getTxDateTime(tx) {
        return new Date(tx.timestamp);
    }
    /**
     * Gets the transaction confirmations.
     *
     * @param {Object} tx The transaction response.
     * @return {Number} The transaction confirmations.
     */
    getTxConfirmations(tx) {
        return this.lastKnownHeight - Number(tx.height);
    }
    /**
     * Gets the transaction hash.
     *
     * @param {Object} tx The transaction response.
     * @return {String} The transaction hash.
     */
    getTxHash(tx) {
        return tx.txhash;
    }
    /**
     * Gets the transaction memo/payment-id.
     *
     * @param {Object} tx The transaction response
     */
    getTxMemo(tx) {
        return tx.tx.value.memo;
    }
    getTotalDelegations(delegations, staking) {
        switch (this.wallet.ticker) {
            case 'ATOM': {
                return this.getTotalDelegationsAtom(delegations, staking);
            }
            case 'BAND': {
                return this.getTotalDelegationsBand(delegations, staking);
            }
            default: {
                throw new Error('Unknown wallet ticker');
            }
        }
    }
    // TODO: remove staking mutation
    getTotalDelegationsBand(delegations, staking) {
        let total = new this.wallet.BN('0');
        delegations.forEach(({ shares, validator_address: validatorAddress }) => {
            const moniker = this.validatorMoniker[validatorAddress] || validatorAddress;
            staking.validators[moniker] = {
                shares: this.wallet.toCurrencyUnit(shares.split('.')[0]),
                address: validatorAddress,
            };
            total = total.add(new this.wallet.BN(shares.split('.')[0]));
        });
        return total;
    }
    // TODO: remove staking mutation
    getTotalDelegationsAtom(delegations, staking) {
        let total = new this.wallet.BN('0');
        delegations.forEach(({ delegation }) => {
            const moniker = this.validatorMoniker[delegation.validator_address] || delegation.validator_address;
            staking.validators[moniker] = {
                shares: this.wallet.toCurrencyUnit(delegation.shares.split('.')[0]),
                address: delegation.validator_address,
            };
            total = total.add(new this.wallet.BN(delegation.shares.split('.')[0]));
        });
        return total;
    }
    async getInfo(address) {
        await this.getLatestBlock();
        const balance = await this.request(`bank/balances/${address}`);
        const delegations = await this.request(`staking/delegators/${address}/delegations`);
        const unbondingDelegations = await this.request(`staking/delegators/${address}/unbonding_delegations`);
        const rewardsReponse = await this.request(`distribution/delegators/${address}/rewards`);
        let rewardsBN = new this.wallet.BN(0);
        if (rewardsReponse.total && rewardsReponse.total.length > 0) {
            rewardsBN = new this.wallet.BN(rewardsReponse.total[0].amount.split('.')[0]);
        }
        const rewards = this.wallet.toCurrencyUnit(rewardsBN.toString());
        let available = '0';
        const staking = { validators: {}, total: new this.wallet.BN('0') };
        const unbonding = { validators: {}, total: new this.wallet.BN('0') };
        let total = new this.wallet.BN(0);
        if (balance && balance.length > 0) {
            const balanceBN = new this.wallet.BN(balance[0].amount);
            total = total.add(balanceBN);
            available = balanceBN.toString();
        }
        if (delegations && delegations.length > 0) {
            const stakingTotal = this.getTotalDelegations(delegations, staking);
            total = total.add(stakingTotal);
            staking.total = this.wallet.toCurrencyUnit(stakingTotal.toString());
        }
        if (unbondingDelegations && unbondingDelegations.length > 0) {
            let unbondingTotal = new this.wallet.BN('0');
            unbondingDelegations.forEach(({ entries, validator_address: validatorAddress }) => {
                const moniker = /* this.validatorMoniker[validatorAddress] || */ validatorAddress;
                unbonding.validators[moniker] = entries
                    .map((entry) => new this.wallet.BN(entry.balance.split('.')[0]))
                    .reduce((prev, cur) => {
                    return prev.add(new this.wallet.BN(cur));
                }, new this.wallet.BN('0'));
                unbondingTotal = unbondingTotal.add(unbonding.validators[moniker]);
            });
            total = total.add(unbondingTotal);
            unbonding.total = this.wallet.toCurrencyUnit(unbondingTotal.toString().split('.')[0]);
        }
        total = total.add(rewardsBN);
        const countAvailableForStake = new this.wallet.BN(available)
            .sub(new this.wallet.BN(this.wallet.feeDefault || 0))
            .sub(new this.wallet.BN(this.wallet.reserveForStake || 0));
        const availableForStake = Number(countAvailableForStake) > 0 ? this.wallet.toCurrencyUnit(countAvailableForStake) : 0;
        return {
            balance: total,
            balances: {
                available: this.wallet.toCurrencyUnit(available),
                total,
                staking,
                rewards,
                unbonding,
                availableForStake,
            },
            transactions: this.wallet.transactions,
        };
    }
    modifyLatestBlockResponse(response) {
        if (!response) {
            throw new Error('[CosmosNodeExplorer] wrong latest block response');
        }
        const blockMetaPropName = Object.hasOwnProperty.call(response, 'block') ? 'block' : 'block_meta';
        this.chainId = response[blockMetaPropName].header.chain_id;
        this.lastKnownHeight = Number(response[blockMetaPropName].header.height) || 0;
        return response;
    }
    getChainId() {
        return this.chainId;
    }
    getTxFee(tx) {
        try {
            const fee = tx.tx.value.fee.amount[0].amount;
            return this.wallet.toCurrencyUnit(fee);
        }
        catch (error) {
            return 0;
        }
    }
}
export default CosmosNodeExplorer;
//# sourceMappingURL=CosmosNodeExplorer.js.map