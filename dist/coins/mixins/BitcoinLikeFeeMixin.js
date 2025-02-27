import coinselect from 'coinselect';
import { BTC_MOCK_ADDR } from '../../utils/index.js';
const BitcoinLikeFeeMixin = (superclass) => class extends superclass {
    /**
     * @param {Number} amount In satoshis
     * @param isSendAll
     * @return {Promise<BN>}
     */
    async getFee({ utxos = null, feePerByte = null } = {}) {
        const utxo = utxos || (await this.getUnspentOutputs());
        const balance = this.calculateBalance(utxo);
        const perByte = feePerByte || this.getFeePerByte();
        const amountInQuantum = balance.toString();
        const inputs = utxo.map(({ txid, vout, script, value, amount }) => ({
            txId: txid,
            vout,
            value: value ? Number(value) : Number(amount),
        }));
        const { fee } = coinselect(inputs, [
            {
                address: BTC_MOCK_ADDR || this.address,
                value: Number(amountInQuantum),
            },
        ], Number(perByte.toString()));
        return new this.BN(fee);
    }
    getMultiplier() {
        return new this.BN(this.coefficient);
    }
    getFeePerByte() {
        return new this.BN(this.feePerByte).add(this.getMultiplier());
    }
    /**
     * Calculates the balance.
     *
     * @param {Object[]} utxos The utxos
     * @return {BN} The balance.
     */
    calculateBalance(utxos = []) {
        return utxos.reduce((acc, { value }) => new this.BN(value).add(acc), new this.BN('0'));
    }
};
export default BitcoinLikeFeeMixin;
//# sourceMappingURL=BitcoinLikeFeeMixin.js.map