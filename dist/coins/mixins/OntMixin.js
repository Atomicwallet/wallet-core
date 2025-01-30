import base58check from 'base58check';
import { ExplorerRequestError } from '../../errors/index.js';
import { LazyLoadedLib } from '../../utils/index.js';
const ontologySdkLib = new LazyLoadedLib(() => import('ontology-ts-sdk'));
const GAS_LIMIT = '25000';
const GAS_PRICE = '3500';
const CLAIM_GAS_PRICE = '2500';
const ONG_DECIMALS = 9;
const SEND_MYSELF_TIMEOUT = 5000;
const CLAIM_THRESHOLD = 0.03; // claim if unbonding+rewards more then this value
const OntMixin = (superclass) => class extends superclass {
    #privateKey;
    constructor(config) {
        super(config);
        this.gasLimit = (config && config.feeData.gasLimit) || GAS_LIMIT;
        this.gasPrice = (config && config.feeData.gasPrice) || GAS_PRICE;
    }
    async loadWallet(seed, mnemonic) {
        const { Crypto } = await ontologySdkLib.get();
        const privateKey = Crypto.PrivateKey.generateFromMnemonic(mnemonic, this.derivation);
        if (!privateKey) {
            throw new Error(`${this.ticker} can't get a privateKey`);
        }
        const publicKey = privateKey.getPublicKey();
        const addressObj = Crypto.Address.fromPubKey(publicKey);
        this.#privateKey = privateKey.serializeWIF();
        this.address = addressObj.toBase58();
        return {
            id: this.id,
            privateKey: this.#privateKey,
            address: this.address,
        };
    }
    get feeTicker() {
        return 'ONG';
    }
    /**
     * Calculate fees
     * @return {*|String}
     */
    getFee() {
        const fee = new this.BN(this.gasLimit).mul(new this.BN(this.gasPrice));
        return fee;
    }
    /**
     * The address getter
     *
     * @return {String}
     */
    async getAddress() {
        if (this.#privateKey) {
            const { Crypto } = await ontologySdkLib.get();
            const privateKeyObj = await this.getPrivateKeyObject();
            const publicKey = privateKeyObj.getPublicKey();
            const addressObj = Crypto.Address.fromPubKey(publicKey);
            return addressObj.toBase58();
        }
        throw new Error(`${this.ticker} privateKey is empty`);
    }
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
        if (!address) {
            return false;
        }
        const { CONST } = await ontologySdkLib.get();
        try {
            const { prefix } = base58check.decode(address, 'hex');
            return prefix === CONST.ADDR_VERSION;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * @param address
     * @param amount
     * @returns {Promise<string>}
     */
    async createTransaction({ address, amount, asset }) {
        if (!asset) {
            asset = this.ticker;
        }
        const { OntAssetTxBuilder, Crypto } = await ontologySdkLib.get();
        const addressFromObj = new Crypto.Address(this.address);
        const addressToObj = new Crypto.Address(address);
        const transaction = OntAssetTxBuilder.makeTransferTx(asset, addressFromObj, addressToObj, Number(amount), GAS_PRICE, GAS_LIMIT);
        return this.signTransaction(transaction);
    }
    async signTransaction(transaction) {
        const { TransactionBuilder } = await ontologySdkLib.get();
        const privateKeyObj = await this.getPrivateKeyObject();
        TransactionBuilder.signTransaction(transaction, privateKeyObj);
        return transaction.serialize();
    }
    createTokenTransaction({ address, amount, asset }) {
        return this.createTransaction({ address, amount, asset });
    }
    async getPrivateKeyObject() {
        const { Crypto } = await ontologySdkLib.get();
        return Crypto.PrivateKey.deserializeWIF(this.#privateKey);
    }
    async sendAllToMyself(asset) {
        const tx = await this.createTransaction({
            address: this.address,
            amount: asset === 'ONT'
                ? this.toMinimalUnit(this.balances.ont, 0)
                : this.toMinimalUnit(this.balances.ong, ONG_DECIMALS),
            asset,
        });
        return this.sendTransaction(tx);
    }
    async checkUnbondSendTxAndRefreshBalance() {
        if (this.balances.ont > 0) {
            await this.sendAllToMyself('ONT');
        }
        else if (this.balances.ong > 0) {
            await this.sendAllToMyself('ONG');
        }
        await new Promise((resolve) => setTimeout(resolve, SEND_MYSELF_TIMEOUT));
        return this.getInfo();
    }
    async checkRewardAndClaim() {
        const tx = await this.createClaimTransaction(this.balances.rewards);
        return this.sendTransaction(tx);
    }
    async makeClaim() {
        const rewards = Number(this.balances.unbonding) + Number(this.balances.rewards);
        if (rewards < CLAIM_THRESHOLD) {
            throw new Error(`Unbonding + rewards ${rewards} ONG is less then ${CLAIM_THRESHOLD} ONG`);
        }
        if (Number(this.balances.ong) <= Number(this.fee)) {
            throw new Error(`${this.balances.ong} ONG is available, but needed ${this.fee} ONG to pay for fee`);
        }
        await this.checkUnbondSendTxAndRefreshBalance();
        return this.checkRewardAndClaim();
    }
    async getInfo() {
        const { balances } = await this.explorer.getInfo(this.address);
        this.balance = this.toMinimalUnit(balances[this.ticker.toLowerCase()]);
        this.balances = balances;
        if (this.tokens.ONG) {
            this.tokens.ONG.balance = this.tokens.ONG.toMinimalUnit(balances?.ong ?? '0');
        }
        return {
            balance: this.balance,
            balances: this.balances,
        };
    }
    async createClaimTransaction(amount) {
        const { CONST, OntAssetTxBuilder, TransactionBuilder, Crypto } = await ontologySdkLib.get();
        const from = new Crypto.Address(this.address);
        const satoshis = this.toMinimalUnit(amount, ONG_DECIMALS);
        const tx = OntAssetTxBuilder.makeWithdrawOngTx(from, from, satoshis, from, CLAIM_GAS_PRICE, `${CONST.DEFAULT_GAS_LIMIT}`);
        const pk = await this.getPrivateKeyObject();
        TransactionBuilder.signTransaction(tx, pk);
        return tx.serialize();
    }
    async claim() {
        try {
            if (!this.address) {
                throw new Error('No coin address');
            }
            if (!this.balances) {
                await this.getInfo(this.address);
            }
            if (this.balances.rewards) {
                return await this.makeClaim();
            }
            throw new Error('No rewards');
        }
        catch (error) {
            throw new ExplorerRequestError({
                type: 'Send',
                error,
                instance: this,
            });
        }
    }
    setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
    }
};
export default OntMixin;
//# sourceMappingURL=OntMixin.js.map