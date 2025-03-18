import { toCurrency } from '../../utils/convert.js';
const Neo3Mixin = (superclass) => class extends superclass {
    async createTransaction({ address, amount, asset = this.ticker }) {
        const contractHash = asset === 'NEO' ? 'NeoToken' : 'GasToken';
        const config = {
            from: this.account,
            to: address,
            integerAmt: Number(amount),
            contractHash: this.coreLib.CONST.NATIVE_CONTRACT_HASH[contractHash],
        };
        const txBuilder = new this.coreLib.api.TransactionBuilder();
        txBuilder.addNep17Transfer(config.from, config.to, config.contractHash, config.integerAmt);
        const txn = txBuilder.build();
        const node = await this.getProvider('node').getClient();
        const networkFacade = await this.coreLib.api.NetworkFacade.fromConfig({
            node,
        });
        const validateResult = await networkFacade.validate(txn);
        if (!validateResult.valid) {
            throw new Error('NEO: Unable to validate transaction');
        }
        const signingConfig = {
            signingCallback: this.coreLib.api.signWithAccount(this.account),
        };
        return networkFacade.sign(txn, signingConfig);
    }
    /**
     * @param rawTx
     * @returns {Promise<{txid}>}
     */
    async sendTransaction(tx) {
        const txid = await this.getProvider('node').sendRawTransaction(tx);
        return { txid };
    }
    async getInfo() {
        const { balance, balances } = await this.getProvider('balance').getInfo(this.address);
        this.balance = this.toMinimalUnit(balance || 0);
        this.balances = balances;
        if (this.tokens.GAS3) {
            this.tokens.GAS3.balance = this.tokens.GAS3.toMinimalUnit(balances?.GAS ?? '0');
        }
        return {
            balance,
            balances,
        };
    }
    async getFee({ sendAmount = '0' } = {}) {
        const [{ feePerByte, executionFeeFactor }, tx] = await Promise.all([
            this.getProvider('node').getFeeInformation(this.coreLib.api),
            this.createTransaction({ address: this.address, amount: sendAmount }),
        ]);
        const result = this.coreLib.api.calculateNetworkFee(tx, feePerByte, executionFeeFactor);
        return toCurrency(result.toString(), 8);
    }
};
export default Neo3Mixin;
//# sourceMappingURL=Neo3Mixin.js.map