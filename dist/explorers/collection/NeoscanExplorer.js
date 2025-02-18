import Explorer from '../../explorers/explorer.js';
const CONFIRMATIONS = 10;
const ASSET_ADDRESS = {
    NEO: 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    GAS: '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7',
};
class NeoscanExplorer extends Explorer {
    getAllowedTickers() {
        return ['NEO', 'GAS'];
    }
    async getInfo(address) {
        const [info, { unclaimed }] = await Promise.all([
            this.request(`get_balance/${address}`),
            this.request(`get_unclaimed/${address}`),
        ]);
        const balances = this.modifyInfoResponse(info);
        const asset = this.wallet.ticker.substr(0, 3).toLowerCase();
        const balance = this.wallet.toMinimalUnit(balances[asset]);
        return {
            balance,
            balances: {
                available: this.wallet.toCurrencyUnit(balance),
                rewards: unclaimed,
                ...balances,
            },
        };
    }
    getTransactionUrl(txId) {
        return `get_transaction/${txId}`;
    }
    getTransactionsUrl(address) {
        return `get_last_transactions_by_address/${address}/0`;
    }
    modifyInfoResponse(response) {
        const balances = {};
        response.balance.forEach(({ asset_symbol: symbol, amount }) => {
            if (['NEO', 'GAS'].includes(symbol)) {
                balances[symbol.toLowerCase()] = amount;
            }
        });
        return balances;
    }
    modifyTransactionsResponse(response, address) {
        return super.modifyTransactionsResponse(this.filterTransactionList(response, address), address);
    }
    filterTransactionList(txList, selfAddress) {
        const asset = this.wallet.ticker.substr(0, 3);
        return txList.filter((transaction) => {
            let isAccept = false;
            if (this.getTxDirection(selfAddress, transaction)) {
                transaction.vouts.forEach((output) => {
                    if (output.asset === ASSET_ADDRESS[asset]) {
                        isAccept = true;
                    }
                });
            }
            else {
                transaction.vin.forEach((input) => {
                    if (input.asset === ASSET_ADDRESS[asset]) {
                        isAccept = true;
                    }
                });
            }
            return isAccept;
        });
    }
    getTxHash(tx) {
        return tx.txid;
    }
    getTxDirection(selfAddress, tx) {
        const vout = tx.vouts && tx.vouts.find(({ address_hash }) => address_hash !== selfAddress);
        return !vout;
    }
    getTxOtherSideAddress(selfAddress, tx) {
        if (!tx.vin) {
            return '...';
        }
        if (this.getTxDirection(selfAddress, tx)) {
            return tx.vin.length > 0 ? tx.vin[0].address_hash : '-';
        }
        let valueOutPrev = new this.wallet.BN(0);
        let addressTo = '...';
        const asset = this.wallet.ticker.substr(0, 3);
        tx.vouts.forEach((output) => {
            if (output.address_hash !== selfAddress && output.asset === ASSET_ADDRESS[asset]) {
                if (valueOutPrev.lt(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)))) {
                    valueOutPrev = new this.wallet.BN(this.wallet.toMinimalUnit(output.value));
                    addressTo = output.address_hash;
                }
            }
        });
        return addressTo;
    }
    getTxValue(selfAddress, tx) {
        let valueIn = new this.wallet.BN(0);
        let valueOut = new this.wallet.BN(0);
        const asset = this.wallet.ticker.substr(0, 3);
        tx.vin.forEach((input) => {
            if (input.address_hash === selfAddress && input.asset === ASSET_ADDRESS[asset]) {
                valueIn = valueIn.add(new this.wallet.BN(this.wallet.toMinimalUnit(input.value)));
            }
        });
        tx.vouts.forEach((output) => {
            if (output.address_hash === selfAddress && output.asset === ASSET_ADDRESS[asset]) {
                valueOut = valueOut.add(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)));
            }
        });
        const valueDiff = valueIn.sub(valueOut);
        const value = valueDiff.abs();
        return Number(this.wallet.toCurrencyUnit(value));
    }
    getTxDateTime(tx) {
        return new Date(Number(`${tx.time}000`));
    }
    getTxConfirmations(tx) {
        return CONFIRMATIONS;
    }
    async sendTransaction(rawtx) {
        return this.wallet.sendTransaction(rawtx);
    }
    getTxFee(tx) {
        return (tx && tx.net_fee) || 0;
    }
    getTxFeeTicker() {
        return 'GAS';
    }
}
export default NeoscanExplorer;
//# sourceMappingURL=NeoscanExplorer.js.map