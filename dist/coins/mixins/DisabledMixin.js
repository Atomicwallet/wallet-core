const DisabledMixin = (superclass) => class extends superclass {
    constructor() {
        super(...arguments);
        this.isDisabled = true;
    }
    async getBalance() {
        return '0';
    }
    async getTransactions() {
        return [];
    }
    async getInfo() {
        const balance = '0';
        this.balance = balance;
        return {
            balance,
        };
    }
    getUnspentOutputs() {
        return [];
    }
    getUTXO() {
        return [];
    }
    sendTransaction() {
        return null;
    }
    getTransaction() {
        return null;
    }
    updateCoinParamsFromServer() {
        return undefined;
    }
};
export default DisabledMixin;
//# sourceMappingURL=DisabledMixin.js.map