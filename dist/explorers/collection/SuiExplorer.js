import { JsonRpcProvider, Connection, RawSigner } from '@mysten/sui.js';
import BN from 'bn.js';
import Explorer from '../../explorers/explorer.js';
const FALLBACK_BASEURL = 'https://fullnode.mainnet.sui.io';
const COIN_TYPE_SUI = '0x2::sui::SUI';
export default class SuiExplorer extends Explorer {
    constructor({ wallet, config }) {
        super(...arguments);
        this.provider = new JsonRpcProvider(new Connection({
            fullnode: config.baseUrl || FALLBACK_BASEURL,
        }));
    }
    async getBalance(address, coinType) {
        const coinBalance = await this.provider.getBalance({
            owner: address,
            coinType,
        });
        return coinBalance.totalBalance;
    }
    async getTransactions({ address, offset, limit, pageNum }) {
        const from = await this.provider.queryTransactionBlocks({
            filter: {
                FromAddress: address,
            },
        });
        const transactionBlocksFrom = await this.provider.multiGetTransactionBlocks({
            digests: from.data.map(({ digest }) => digest),
            options: {
                showInput: true,
                showEffects: true,
                showBalanceChanges: true,
            },
        });
        const balanceChangesFrom = transactionBlocksFrom.flatMap(({ balanceChanges, digest, effects, timestampMs }) => {
            return balanceChanges?.map(({ owner: { AddressOwner }, amount, coinType }) => ({
                txid: digest,
                otherSideAddress: AddressOwner,
                amount,
                coinType,
                fee: effects.gasUsed,
                timestampMs,
                direction: false,
            }));
        });
        const to = await this.provider.queryTransactionBlocks({
            filter: {
                ToAddress: address,
            },
        });
        const transactionBlocksTo = await this.provider.multiGetTransactionBlocks({
            digests: to.data.map(({ digest }) => digest),
            options: {
                showInput: true,
                showEffects: true,
                showBalanceChanges: true,
            },
        });
        // filter out sent to self and other addresses
        const otherSideIsNotMeAndAmountIsPositive = ({ otherSideAddress, amount }) => otherSideAddress !== address && amount > 0;
        const otherSideIsNotMe = ({ otherSideAddress }) => otherSideAddress !== address;
        const balanceChangesTo = transactionBlocksTo.flatMap(({ balanceChanges, digest, transaction: { data }, effects, timestampMs }) => {
            return balanceChanges
                ?.filter(({ owner: { AddressOwner } }) => AddressOwner === address)
                ?.map(({ amount, coinType }) => ({
                txid: digest,
                otherSideAddress: data?.sender,
                amount,
                coinType,
                fee: effects.gasUsed,
                timestampMs,
                direction: true,
            }));
        });
        const response = [
            ...balanceChangesFrom.filter(otherSideIsNotMe),
            ...balanceChangesTo.filter(otherSideIsNotMeAndAmountIsPositive),
        ]
            .filter(({ coinType }) => coinType === COIN_TYPE_SUI)
            .sort((first, second) => {
            if (first?.timestampMs < second?.timestampMs) {
                return 1;
            }
            if (first?.timestampMs > second?.timestampMs) {
                return -1;
            }
            return 0;
        });
        return this.modifyTransactionsResponse(response, address);
    }
    modifyTransactionsResponse(response, address) {
        return response.reduce((list, tx) => {
            try {
                list.push(this.getTransactionModifiedResponse(tx, address));
            }
            catch (error) {
                console.error(error);
            }
            return list;
        }, []);
    }
    getTxConfirmations() {
        return 1;
    }
    getTxDateTime(tx) {
        // sometimes tx does not have `timestampMs`
        // (probably it is not confirmed yet)
        return new Date(Number(tx.timestampMs) || Date.now());
    }
    getTxDirection(selfAddress, tx) {
        return tx.direction;
    }
    getTxOtherSideAddress(selfAddress, tx) {
        return tx.otherSideAddress;
    }
    getTxValue(selfAddress, tx) {
        return this.wallet.toCurrencyUnit(tx.amount);
    }
    getTxFee(tx) {
        return this.wallet.toCurrencyUnit(BigInt(tx.fee.computationCost || 0) + BigInt(tx.fee.storageCost || 0) - BigInt(tx.fee.storageRebate || 0));
    }
    getTxFeeTicker() {
        return this.wallet.ticker;
    }
    async calculateFee(tx) {
        const dryRunResult = await this.provider.dryRunTransactionBlock({
            transactionBlock: tx.transactionBlockBytes,
        });
        const { computationCost, nonRefundableStorageFee } = dryRunResult.effects.gasUsed;
        return new BN(computationCost).add(new BN(nonRefundableStorageFee));
    }
    async sign(keypair, tx) {
        const signer = new RawSigner(keypair, this.provider);
        return signer.signTransactionBlock({ transactionBlock: tx });
    }
    async send(tx) {
        return this.provider.executeTransactionBlock({
            transactionBlock: tx.transactionBlockBytes,
            signature: tx.signature,
        });
    }
}
//# sourceMappingURL=SuiExplorer.js.map