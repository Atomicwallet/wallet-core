import crypto from 'crypto';
import util from 'util';
import axios from 'axios';
import { Coin } from '../../abstract/index.js';
import { ATOMIC_HEDERA_ACCOUNTS_SERVICE } from '../../env.js';
import { WalletError } from '../../errors/index.js';
import HashnodeExplorer from '../../explorers/collection/HashnodeExplorer.js';
import HederaMirrorNodeExplorer from '../../explorers/collection/HederaMirrorNodeExplorer.js';
import HederaStakingExplorer from '../../explorers/collection/HederaStakingExplorer.js';
import KabutoExplorer from '../../explorers/collection/KabutoExplorer.js';
import { Amount, LazyLoadedLib, logger } from '../../utils/index.js';
import { WALLET_ERROR } from '../../utils/const/index.js';
import { HasProviders, StakingMixin } from '../mixins/index.js';
const NAME = 'Hedera';
const TICKER = 'HBAR';
const DERIVATION = "m/44'/3030'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '100000000';
const HEDERA_SDK = 'hederaSdk';
class HBARCoin extends StakingMixin(HasProviders(Coin)) {
    #privateKey;
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {String} fee the fee data
     * @param {Explorer[]}  explorers the explorers
     * @param {String} txWebUrl the transmit web url
     */
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
        const config = {
            id,
            alias,
            notify,
            name: NAME,
            ticker: TICKER,
            decimal: DECIMAL,
            unspendableBalance: UNSPENDABLE_BALANCE,
            explorers,
            txWebUrl,
            socket,
            dependencies: {
                [HEDERA_SDK]: new LazyLoadedLib(() => import('hedera-sdk-v2')),
            },
        };
        super(config, db, configManager);
        this.derivation = DERIVATION;
        this.setExplorersModules([HashnodeExplorer, KabutoExplorer, HederaStakingExplorer, HederaMirrorNodeExplorer]);
        this.loadExplorers(config);
        this.grpc = feeData.grpc;
        this.fee = feeData.fee;
        this.updateAccountFee = feeData.updateAccountFee;
        this.transactions = [];
        this.fields.paymentId = true;
    }
    /**
     * @typedef HederaSdkV2
     * @type {object}
     * @property {import('hedera-sdk-v2').Hbar} Hbar
     * @property {import('hedera-sdk-v2').Client} Client
     * @property {import('hedera-sdk-v2').AccountId} AccountId
     * @property {import('hedera-sdk-v2').PublicKey} PublicKey
     * @property {import('hedera-sdk-v2').PrivateKey} PrivateKey
     * @property {import('hedera-sdk-v2').TransferTransaction} TransferTransaction
     * @property {import('hedera-sdk-v2').AccountCreateTransaction} AccountCreateTransaction
     */
    /**
     * @async
     * @returns {Promise<HederaSdkV2>}
     */
    loadLib() {
        return super.loadLib(HEDERA_SDK);
    }
    /**
     * Gets fee for update account tx
     *
     * @return {string}
     */
    getFee(options) {
        return new this.BN(options?.feeLimit ?? this.fee);
    }
    async #createAccount() {
        try {
            const { data } = await axios.post(ATOMIC_HEDERA_ACCOUNTS_SERVICE, {
                publicKey: this.publicKey,
            });
            if (!data.accountId) {
                throw new Error('Failed creating HBAR account');
            }
            this.address = data.accountId;
        }
        catch (error) {
            // address already exists
            if (error.isAxiosError && error.response.status === 409) {
                return;
            }
            throw error;
        }
    }
    #deriveChildKey(parentKey, chainCode, index) {
        const hmac = crypto.createHmac('SHA512', Buffer.from(chainCode));
        const input = Buffer.alloc(37);
        // 0x00 + parentKey + index(BE)
        input[0] = 0;
        input.set(parentKey, 1);
        new DataView(input.buffer).setUint32(33, index, false);
        // set the index to hardened
        input[33] |= 128;
        hmac.update(input);
        const digest = hmac.digest();
        return { keyBytes: digest.subarray(0, 32), chainCode: digest.subarray(32) };
    }
    async #fromMnemonic(mnemonic, phrase) {
        const pbkdf2 = util.promisify(crypto.pbkdf2);
        const input = mnemonic.toString();
        const salt = `mnemonic${phrase}`;
        const seed = await pbkdf2(input, salt, 2048, 64, 'sha512');
        const hmac = crypto.createHmac('sha512', 'ed25519 seed');
        hmac.update(seed);
        const digest = hmac.digest();
        let keyBytes = digest.subarray(0, 32);
        let chainCode = digest.subarray(32);
        for (const index of [44, 3030, 0, 0]) {
            ({ keyBytes, chainCode } = this.#deriveChildKey(keyBytes, chainCode, index));
        }
        const { PrivateKey } = await this.loadLib();
        const key = PrivateKey.fromBytes(keyBytes);
        key._chainCode = chainCode;
        return key;
    }
    async loadWallet(seed, phrase) {
        const privateKey = await this.#fromMnemonic(phrase);
        if (!privateKey) {
            throw new WalletError({
                type: WALLET_ERROR,
                error: new Error("can't get a privateKey!"),
                instance: this,
            });
        }
        this.#privateKey = privateKey.toString();
        this.publicKey = privateKey.publicKey.toString();
        if (!this.address) {
            // try to get account ID by public key from own service
            try {
                const { data: { accountId }, } = await axios.get(ATOMIC_HEDERA_ACCOUNTS_SERVICE + this.publicKey);
                this.address = accountId;
            }
            catch (error) {
                logger.log({ instance: this, error });
            }
        }
        return { id: this.id, privateKey: this.#privateKey, address: this.address };
    }
    /**
     * The address getter
     *
     * @return {String|WalletError}
     */
    getAddress() {
        if (this.address && this.#privateKey) {
            return this.address;
        }
        throw new WalletError({
            type: WALLET_ERROR,
            error: new Error('address or privateKey is empty!'),
            instance: this,
        });
    }
    /**
     * Try get accountID by publicKey
     * @param {String}  publicKey
     * @returns {Promise<String>}
     */
    async getAddressByPublicKey(publicKey = null) {
        if (!publicKey && !this.publicKey) {
            throw new WalletError({
                type: WALLET_ERROR,
                error: new Error('PublicKey is empty'),
                instance: this,
            });
        }
        if (!publicKey) {
            publicKey = this.publicKey;
        }
        try {
            const { accountId } = await axios.get(ATOMIC_HEDERA_ACCOUNTS_SERVICE + this.publicKey);
            return accountId;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
        const { AccountId } = await this.loadLib();
        try {
            return AccountId.fromString(address);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * get client v2
     * @returns {ClientV2}
     */
    async getClient() {
        if (!this.clientV2) {
            const { Client } = await this.loadLib();
            this.clientV2 = Client.forMainnet({ scheduleNetworkUpdate: true });
            this.clientV2.setOperator(this.address, this.#privateKey);
            this.clientV2.setMirrorNetwork(this.grpc);
        }
        return this.clientV2;
    }
    /**
     * sign
     * @param tx
     * @returns {Promise<Transaction>}
     */
    async signTransaction(tx) {
        const client = await this.getClient();
        tx.freezeWith(client);
        const { PrivateKey } = await this.loadLib();
        return tx.sign(PrivateKey.fromString(this.#privateKey));
    }
    /**
     * Create transaction
     * @param address
     * @param amount
     * @returns {Promise<string>}
     */
    async createTransaction({ address, amount, memo }) {
        const { Hbar, TransferTransaction } = await this.loadLib();
        const tx = new TransferTransaction()
            .addHbarTransfer(this.address, Hbar.fromTinybars(amount).negated())
            .addHbarTransfer(address, Hbar.fromTinybars(amount));
        //
        if (memo) {
            tx.setTransactionMemo(memo);
        }
        const signedTx = await this.signTransaction(tx);
        return signedTx;
    }
    async sendTransaction(signedTx) {
        const client = await this.getClient();
        const { transactionId } = await signedTx.execute(client);
        return { txid: transactionId.toString() };
    }
    /**
     * Method for create new accountID
     * @param publicKey
     * @param initialBalance
     * @returns {Promise<string>}
     */
    async createAccountTransaction(publicKey, initialBalance) {
        const { Hbar, PublicKey, AccountCreateTransaction } = await this.loadLib();
        const pubKey = PublicKey.fromString(publicKey);
        const tx = new AccountCreateTransaction().setKey(pubKey).setInitialBalance(Hbar.fromTinybars(initialBalance));
        const signedTx = await this.signTransaction(tx);
        return Buffer.from(signedTx.toBytes()).toString('hex');
    }
    async getInfo() {
        const { balance } = await this.getProvider('balance').getInfo(this.address);
        this.balance = balance;
        await this.getStakingInfo();
        return {
            balance,
            balances: this.balances,
        };
    }
    async fetchStakingInfo() {
        const { pending_reward: pendingReward, staked_node_id: stakedNodeId } = await this.getProvider('staking').getInfo(this.address);
        const rewards = this.calculateRewards(pendingReward);
        const staked = this.calculateStakedBalance(stakedNodeId);
        const validators = {};
        if (stakedNodeId !== null) {
            validators[stakedNodeId] = { address: stakedNodeId, rewards, staked };
        }
        return { availableForUnstake: staked, rewards, staked, validators };
    }
    calculateRewards(pendingReward) {
        return new Amount(pendingReward, this);
    }
    calculateStakedBalance(stakedNodeId) {
        return new Amount(stakedNodeId === null ? '0' : this.balance, this);
    }
    // @TODO `total` param is not passed from `StakingMixin::makeStakingInfoStruct::calculateAvailableForStake`
    // probably it should be `balance`?
    async calculateAvailableForStake({ balance }) {
        const available = balance.toBN().sub(new this.BN(this.fee)).sub(new this.BN(this.reserveForStake));
        return new Amount(available.isNeg() ? '0' : available, this);
    }
    calculateTotal({ balance, rewards }) {
        return new Amount(balance.toBN().add(rewards.toBN()).toString(), this);
    }
    async claim() {
        const { staked_node_id: validator } = await this.getProvider('staking').getInfo(this.address);
        return this.stake({ validator });
    }
    async stake({ validator }) {
        const { transactionHash } = await this.getProvider('staking').stake(this, validator, this.#privateKey);
        return Buffer.from(transactionHash).toString('hex');
    }
    async unstake() {
        const { transactionHash } = await this.getProvider('staking').unstake(this, this.#privateKey);
        return Buffer.from(transactionHash).toString('hex');
    }
    async getTransactions() {
        if (!this.address) {
            throw new Error('HBAR: getTransactions error: address is not loaded');
        }
        const txs = await this.getProvider('history').getTransactions({
            address: this.address,
        });
        return txs;
    }
    async setPrivateKey(privateKey) {
        this.#privateKey = privateKey;
        const { PrivateKey } = await this.loadLib();
        this.publicKey = PrivateKey.fromString(privateKey).publicKey.toString();
    }
    /**
     * Don't use it! Use the wallet itself, you don't need `instance`.
     * @private
     * @deprecated
     */
    get instance() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const wallet = this;
        return Object.assign(super.instance, {
            // TODO do we really need a public field with private key?
            get privateKey() {
                return wallet.privateKey;
            },
        });
    }
    async activate() {
        if (!this.address) {
            await this.#createAccount();
        }
        await super.activate();
    }
}
export default HBARCoin;
//# sourceMappingURL=HBARCoin.js.map