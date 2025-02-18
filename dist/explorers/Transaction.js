export default class Transaction {
    constructor(fields) {
        if (typeof fields !== 'object') {
            throw new TypeError('Transaction: constructor arguments object must be used');
        }
        if (!fields.ticker) {
            throw new Error('Transaction: must have ticker');
        }
        if (!fields.datetime) {
            throw new Error('Transaction: must have datetime object');
        }
        if (typeof fields.datetime === 'string') {
            fields.datetime = new Date(fields.datetime);
        }
        this.alias = fields.alias || 'atomic';
        this.ticker = fields.ticker;
        this.datetime = fields.datetime;
        this.timestamp = fields.timestamp || this.datetime.getTime();
        this.wallet = fields.wallet;
        this.walletid = fields.wallet.id;
        this.explorer = fields.explorer;
        this.txid = fields.txid;
        this.direction = fields.direction;
        this.otherSideAddress = fields.otherSideAddress;
        this.amount = fields.amount;
        this.memo = fields.memo;
        this.confirmations = fields.confirmations;
        this.fee = fields.fee;
        this.date = this.getDate();
        this.time = this.getTime();
    }
    getDateTime() {
        return new Date(Number(`${this.timestamp}`));
    }
    getDate() {
        return this.datetime.toDateString().slice(4);
    }
    getTime() {
        return this.datetime.toTimeString().slice(0, 5);
    }
    getStatus() {
        return this.confirmations > 1 ? { text: 'Confirmed', color: '#06CE91' } : { text: 'Pending' };
    }
    getHash() {
        return this.txid;
    }
    static fromHistory(fields) {
        const tx = new this(fields);
        tx.direction = fields.direction === 'in';
        tx.datetime = tx.getDateTime();
        tx.otherSideAddress = fields.recepient || '';
        return tx;
    }
}
//# sourceMappingURL=Transaction.js.map